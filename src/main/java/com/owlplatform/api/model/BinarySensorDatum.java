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
public class BinarySensorDatum implements Serializable{
  

  private static final long serialVersionUID = -4099953871186285879L;
  public BinarySensorDatum(final String transmitter, final long timestamp, final boolean isStart){
    this.tx = transmitter;
    this.ts = timestamp;
    this.ev = isStart;
  }
  
  private final String tx;
  private final long ts;
  private final boolean ev;
  public String getTx() {
    return tx;
  }
  public long getTs() {
    return ts;
  }
  public boolean isEv() {
    return ev;
  }
  
}
