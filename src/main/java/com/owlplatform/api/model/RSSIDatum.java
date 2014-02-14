/*
 * Owl Platform
 * Copyright (C) 2014 Robert Moore and the Owl Platform
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *  
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
package com.owlplatform.api.model;

import java.io.Serializable;

import javax.xml.bind.annotation.XmlRootElement;

/**
 * @author Robert Moore
 *
 */
@XmlRootElement
public final class RSSIDatum implements Serializable{
  
  /**
   * 
   */
  private static final long serialVersionUID = -2676775781465474226L;
  public RSSIDatum(String transmitter, String receiver, float rssi, long timestamp){
    this.rssi = rssi;
    this.transmitter = transmitter;
    this.receiver = receiver;
    this.timestamp = timestamp;
  }
  
  private final float rssi;
  private final String transmitter;
  private final String receiver;
  private final long timestamp;
  public float getRssi() {
    return rssi;
  }

  public String getTransmitter() {
    return transmitter;
  }

  public String getReceiver() {
    return receiver;
  }

  public long getTimestamp() {
    return timestamp;
  }
  
}
