/*
 * Author: Patrick Grimard
 * URL: http://jpgmr.wordpress.com/2010/07/28/tutorial-implementing-a-servlet-filter-for-jsonp-callback-with-springs-delegatingfilterproxy/
 */
package com.owlplatform.api.filter;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

/**
 * @author Robert Moore
 */
public class GenericResponseWrapper extends HttpServletResponseWrapper {

  private ByteArrayOutputStream output;
  private int contentLength;
  private String contentType;

  public GenericResponseWrapper(HttpServletResponse response) {
    super(response);
    this.output = new ByteArrayOutputStream();
  }

  public byte[] getData() {
    return this.output.toByteArray();
  }

  @Override
  public ServletOutputStream getOutputStream() {
    return new FilterServletOutputStream(this.output);
  }

  @Override
  public PrintWriter getWriter() {
    return new PrintWriter(this.getOutputStream(), true);
  }

  @Override
  public void setContentLength(int length) {
    this.contentLength = length;
    super.setContentLength(this.contentLength);
  }

  public int getContentLength() {
    return this.contentLength;
  }

  @Override
  public void setContentType(String type) {
    this.contentType = type;
    super.setContentType(this.contentType);
  }

  @Override
  public String getContentType() {
    return this.contentType;
  }
}
