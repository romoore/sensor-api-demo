/*
 * Author: Patrick Grimard
 * URL: http://jpgmr.wordpress.com/2010/07/28/tutorial-implementing-a-servlet-filter-for-jsonp-callback-with-springs-delegatingfilterproxy/
 */
package com.owlplatform.api.filter;

import java.io.DataOutputStream;
import java.io.OutputStream;
import java.io.IOException;

import javax.servlet.ServletOutputStream;

/**
 * @author Robert Moore
 *
 */
public class FilterServletOutputStream extends ServletOutputStream {
  private DataOutputStream stream;
  public FilterServletOutputStream(OutputStream output){
    this.stream = new DataOutputStream(output);
  }
  public void write(int b) throws IOException {
    this.stream.write(b);
  }
  public void write(byte[] b) throws IOException {
    this.stream.write(b);
  }
  public void write(byte[] b, int off, int len) throws IOException {
    this.stream.write(b,off,len);
  }
}
