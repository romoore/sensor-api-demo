/*
 * Owl Platform
 * Copyright (C) 2013 Robert Moore and Inpoint Systems Inc.
 * All rights reserved.
 */
package com.owlplatform.api.pub;

import java.util.Collection;
import java.util.Random;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import javax.xml.ws.RequestWrapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.owlplatform.api.model.RSSIDatum;
import com.owlplatform.common.SampleMessage;
import com.owlplatform.server.AggConnectionListener;
import com.owlplatform.server.DataStore;

/**
 * @author Robert Moore
 */
// The path is relative from the "/pub" path configured in web.xml
@Path("/rssi")
public class LatestRSSIResource {
  private static final Logger log = LoggerFactory
      .getLogger(LatestRSSIResource.class);

  private static final Random rand = new Random(System.currentTimeMillis());

  @Path("all")
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public RSSIDatum[] getAllRSSI(@Context HttpServletRequest reqCtx) {
    // Validate email is "valid"

    DataStore ds = (DataStore) reqCtx.getServletContext().getAttribute(
        AggConnectionListener.KEY_DATA_STORE);
    Collection<RSSIDatum> allRssi = ds.getAll();
    return allRssi.toArray(new RSSIDatum[] {});

  }

  @Path("since")
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public RSSIDatum[] getRecentRSSI(@Context HttpServletRequest reqCtx,
      @QueryParam("since") long since,@QueryParam("txid")String txid) {
    DataStore ds = (DataStore) reqCtx.getServletContext().getAttribute(
        AggConnectionListener.KEY_DATA_STORE);
    if(txid == null){
    Collection<RSSIDatum> allRssi = ds.getSince(since);
    return allRssi.toArray(new RSSIDatum[] {});
    }else {
      Collection<RSSIDatum> txRSSI = ds.getSinceTx(since,txid);
      return txRSSI.toArray(new RSSIDatum[]{});
    
    }

  }
}
