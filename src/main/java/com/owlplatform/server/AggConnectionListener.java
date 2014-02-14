/*
 * Owl Platform
 * Copyright (C) 2013 Robert Moore and Inpoint Systems Inc.
 * All rights reserved.
 */
package com.owlplatform.server;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Application Lifecycle Listener implementation class WMConnectionListener
 */
@WebListener
public class AggConnectionListener implements ServletContextListener {

  public static final String KEY_AGG_CONNECT = "wmConnector";
  public static final String KEY_DATA_STORE = "wmData";

  private static final Logger log = LoggerFactory
      .getLogger(AggConnectionListener.class);

  /**
   * @see ServletContextListener#contextInitialized(ServletContextEvent)
   */
  public void contextInitialized(ServletContextEvent arg0) {
    String aggHost = (String) arg0.getServletContext().getInitParameter(
        "agg.host");
    int aggPort = Integer.parseInt(arg0.getServletContext().getInitParameter(
        "agg.port"));

    DataStore ds = new DataStore();
    AggConnector conn = new AggConnector(aggHost, aggPort, ds);
    conn.start();

    arg0.getServletContext().setAttribute(KEY_AGG_CONNECT, conn);
    arg0.getServletContext().setAttribute(KEY_DATA_STORE, ds);

  }

  /**
   * @see ServletContextListener#contextDestroyed(ServletContextEvent)
   */
  public void contextDestroyed(ServletContextEvent arg0) {
    AggConnector conn = (AggConnector) arg0.getServletContext().getAttribute(
        KEY_AGG_CONNECT);
    if (conn != null) {
      conn.disconnect();

      log.info("Closed connection to aggregator.");
      arg0.getServletContext().removeAttribute(KEY_AGG_CONNECT);
      arg0.getServletContext().removeAttribute(KEY_DATA_STORE);

    }
  }

}
