/*
 * Owl Platform
 * Copyright (C) 2013 Robert Moore and Inpoint Systems Inc.
 * All rights reserved.
 */
package com.owlplatform.server;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedList;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentSkipListSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.owlplatform.api.model.BinarySensorDatum;
import com.owlplatform.api.model.RSSIDatum;
import com.owlplatform.common.SampleMessage;

/**
 * @author Robert Moore
 */
public class DataStore {

  private static final Logger log = LoggerFactory.getLogger(DataStore.class);

  private static final int MAX_HISTORY_LENGTH = 100;

  private static final class RSSIDateComparator implements
      Comparator<RSSIDatum> {
    public int compare(RSSIDatum o1, RSSIDatum o2) {
      long diff = o1.getTimestamp() - o2.getTimestamp();
      if (diff < 0) {
        return -1;
      }
      return diff == 0 ? 0 : 1;
    }
  }

  private static final class BinaryDateComparator implements
      Comparator<BinarySensorDatum> {
    public int compare(BinarySensorDatum o1, BinarySensorDatum o2) {
      long diff = o1.getTs() - o2.getTs();
      if (diff < 0) {
        return -1;
      }
      return diff == 0 ? 0 : 1;
    }
  }

  private final ConcurrentSkipListSet<RSSIDatum> rssiQueue = new ConcurrentSkipListSet<RSSIDatum>(
      new RSSIDateComparator());
  private final ConcurrentSkipListSet<BinarySensorDatum> binEvtQueue = new ConcurrentSkipListSet<BinarySensorDatum>(
      new BinaryDateComparator());

  /**
   * Oldest age for on-demand data like RSSI.
   */
  private static final long MAX_AGE = 300000;

  private static final char[] hexArray = { '0', '1', '2', '3', '4', '5', '6',
      '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' };

  private static String toHexString(final byte[] bytes) {
    if (bytes == null) {
      return "";
    }
    StringBuilder sb = new StringBuilder();
    boolean firstZero = true;
    for (int i = 0, j = 0; i < bytes.length; ++i) {
      if (firstZero && bytes[i] == 0) {
        continue;
      }
      firstZero = false;
      sb.append(hexArray[(bytes[i] >> 4) & 0x0f]);
      sb.append(hexArray[bytes[i] & 0x0f]);
    }
    return sb.toString();
  }

  public void addSample(SampleMessage sample) {
    final String txId = toHexString(sample.getDeviceId());
    RSSIDatum datum = new RSSIDatum(txId, toHexString(sample.getReceiverId()),
        sample.getRssi(), sample.getCreationTimestamp());
    this.rssiQueue.add(datum);
    while (this.rssiQueue.size() > MAX_HISTORY_LENGTH) {
      this.rssiQueue.pollFirst();
    }
    byte[] data = sample.getSensedData();
    if (data != null && (data[0] & 0x81) == 0x01) {
      this.binEvtQueue.add(new BinarySensorDatum(txId, sample
          .getCreationTimestamp(),
          (data[1] & 0x01) == 0x01 ? false : true));
    }
    while (this.binEvtQueue.size() > MAX_HISTORY_LENGTH) {
      this.binEvtQueue.pollFirst();
    }
  }

  public Collection<RSSIDatum> getRSSIAll() {
    ArrayList<RSSIDatum> copy = new ArrayList<>(MAX_HISTORY_LENGTH);
    copy.addAll(this.rssiQueue);
    return copy;

  }

  public Collection<RSSIDatum> getRSSISince(long timestamp) {
    LinkedList<RSSIDatum> copy = new LinkedList<RSSIDatum>();
    copy.addAll(this.rssiQueue.tailSet(new RSSIDatum(null, null, 0, timestamp)));
    return copy;
  }

  public Collection<BinarySensorDatum> getBinSince(long timestamp) {
    LinkedList<BinarySensorDatum> copy = new LinkedList<BinarySensorDatum>();
    copy.addAll(this.binEvtQueue.tailSet(new BinarySensorDatum(null, timestamp,
        false)));
    return copy;
  }

}
