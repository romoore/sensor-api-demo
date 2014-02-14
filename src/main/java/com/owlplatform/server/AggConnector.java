/*
 * Owl Platform
 * Copyright (C) 2013 Robert Moore and Inpoint Systems Inc.
 * All rights reserved.
 */
package com.owlplatform.server;

import java.math.BigInteger;
import java.util.Collection;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.owlplatform.common.SampleMessage;
import com.owlplatform.solver.SolverAggregatorInterface;
import com.owlplatform.solver.listeners.SampleListener;
import com.owlplatform.solver.rules.SubscriptionRequestRule;

/**
 * @author Robert Moore
 */
public class AggConnector extends Thread implements SampleListener {

  private static final Logger log = LoggerFactory.getLogger(AggConnector.class);

  private SolverAggregatorInterface conn = null;

  // private final Set<String> recentEmailIdents = Collections.newSetFromMap(new
  // ConcurrentHashMap<String,Boolean>());
  // private final Set<String> recentSMSIdents = Collections.newSetFromMap(new
  // ConcurrentHashMap<String,Boolean>());

  // private static final int MAX_HISTORY_LENGTH = 10;
  // private final ConcurrentSkipListSet<SensorStatus> history = new
  // ConcurrentSkipListSet<SensorStatus>(new SensorStatusDateComparator());
  // private Timer squelchTimer = new Timer();

  private boolean keepRunning = true;

  private String host = "localhost";
  private int port = 7008;

  private final DataStore dataStore;

  public AggConnector() {
    this.dataStore = new DataStore();
  }

  /**
   * Creates a new world model connection with the provided connection
   * parameters and a new DataStore object.
   * 
   * @param host
   *          the hostname or IP address of the world model.
   * @param cPort
   *          the client listen port.
   * @param sPort
   *          the solver listen port.
   */
  public AggConnector(String host, int port) {
    this(host, port, new DataStore());
  }

  public AggConnector(String host, int port, final DataStore store) {
    this.host = host;
    this.port = port;
    this.dataStore = store;
  }

  @Override
  public void run() {
    this.conn = new SolverAggregatorInterface();
    this.conn.addSampleListener(this);
    this.conn.setHost(this.host);
    this.conn.setPort(this.port);
    this.conn.setRules(new SubscriptionRequestRule[] { SubscriptionRequestRule
        .generateGenericRule() });
    while (!this.conn.isConnected()) {

      if (!this.conn.connect(2000)) {
        log.warn("Failed to connect to Aggregator at {}:{}", this.host,
            this.port);
        try {
          Thread.sleep(1000);
        } catch (InterruptedException ie) {
        }
      }

    }

    while (this.keepRunning) {

      try {
        synchronized (this) {
          this.wait();
        }
      } catch (InterruptedException e) {

      }
    }

    this.conn.disconnect();
    this.conn.removeSampleListener(this);
  }

  public void disconnect() {
    this.keepRunning = false;
    this.notifyAll();
  }

  /* (non-Javadoc)
   * @see com.owlplatform.solver.listeners.SampleListener#sampleReceived(com.owlplatform.solver.SolverAggregatorInterface, com.owlplatform.common.SampleMessage)
   */
  @Override
  public void sampleReceived(SolverAggregatorInterface aggregator,
      SampleMessage sample) {
    this.dataStore.addSample(sample);

  }

}
