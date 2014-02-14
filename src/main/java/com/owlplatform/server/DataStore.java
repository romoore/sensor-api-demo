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

  private final ConcurrentSkipListSet<RSSIDatum> rssiQueue = new ConcurrentSkipListSet<RSSIDatum>(
      new RSSIDateComparator());
  // private final ConcurrentLinkedQueue<RSSIDatum> rssiQueue = new
  // ConcurrentLinkedQueue<>();

  /**
   * Oldest age for on-demand data like RSSI.
   */
  private static final long MAX_RSSI_AGE = 300000;

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
    RSSIDatum datum = new RSSIDatum(toHexString(sample.getDeviceId()),
        toHexString(sample.getReceiverId()), sample.getRssi(),
        sample.getCreationTimestamp());
    this.rssiQueue.add(datum);
    while (this.rssiQueue.size() > MAX_HISTORY_LENGTH) {
      this.rssiQueue.pollFirst();
    }
  }

  public Collection<RSSIDatum> getAll() {
    ArrayList<RSSIDatum> copy = new ArrayList<>(MAX_HISTORY_LENGTH);
    copy.addAll(this.rssiQueue);
    return copy;

  }

  public Collection<RSSIDatum> getSince(long timestamp) {
    LinkedList<RSSIDatum> copy = new LinkedList<RSSIDatum>();
    copy.addAll(this.rssiQueue.tailSet(new RSSIDatum(null, null, 0, timestamp)));
    return copy;
  }

  public Collection<RSSIDatum> getSinceTx(long timestamp, String txid) {
    if(txid == null){
      return getSince(timestamp);
    }
    LinkedList<RSSIDatum> copy = new LinkedList<RSSIDatum>();
    for (RSSIDatum d : this.rssiQueue.tailSet(new RSSIDatum(null, null, 0,
        timestamp))) {
      if (d.getTransmitter().equals(txid)) {
        copy.add(d);
      }
    }
    return copy;
  }

}
