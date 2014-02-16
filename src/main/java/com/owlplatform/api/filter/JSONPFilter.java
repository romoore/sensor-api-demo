/*
 * Owl Platform
 * Copyright (C) 2014 Robert Moore and Inpoint Systems Inc.
 * All rights reserved.
 */
package com.owlplatform.api.filter;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.ws.rs.core.MediaType;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Servlet Filter implementation class SessionFilter
 */
@WebFilter(description = "Makes JSON into JSONP", urlPatterns = { "/p/rssi/*","/p/evt/*" })
public class JSONPFilter implements Filter {

  private static final Logger log = LoggerFactory.getLogger(JSONPFilter.class);

  /**
   * Default constructor.
   */
  public JSONPFilter() {
    // TODO Auto-generated constructor stub
  }

  /**
   * @see Filter#destroy()
   */
  public void destroy() {
    // TODO Auto-generated method stub
  }

  /**
   * @see Filter#doFilter(ServletRequest, ServletResponse, FilterChain)
   */
  public void doFilter(ServletRequest request, ServletResponse response,
      FilterChain chain) throws IOException, ServletException {

    // Only check HTTP requests?
    // TODO: Verify this is sufficient
    HttpServletRequest req = (HttpServletRequest) request;
    HttpServletResponse resp = (HttpServletResponse) response;
    HttpSession session = req.getSession(true);

    Map<String, String[]> parms = req.getParameterMap();
    if (parms.containsKey("callback")) {
      OutputStream out = resp.getOutputStream();
      GenericResponseWrapper wrapper = new GenericResponseWrapper(resp);
      // pass the request along the filter chain
      chain.doFilter(request, wrapper);

      out.write(new String(parms.get("callback")[0] + "(").getBytes());
      out.write(wrapper.getData());
      out.write(new String(");").getBytes());

      wrapper.setContentType("text/javascript;charset=UTF-8");

      out.close();

    } else {
      chain.doFilter(req, resp);
    }

  }

  /**
   * @see Filter#init(FilterConfig)
   */
  public void init(FilterConfig fConfig) throws ServletException {
    // TODO Auto-generated method stub
  }

}
