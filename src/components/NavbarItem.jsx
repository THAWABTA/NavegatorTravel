"use client";
import React from "react";

const NavItem = ({ text, href = "#" }) => (
  <a href={href} className="nav-link">{text}</a>
);

export default NavItem;
