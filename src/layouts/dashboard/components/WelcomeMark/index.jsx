import React, { useState } from "react";
// We are removing MUI imports:
// import { Card, Icon } from "@mui/material";
// import VuiBox from "@/components/VuiBox";
// import VuiTypography from "@/components/VuiTypography";

import gif from "@/assets/images/cardimgfree.png"; // Assuming this path is correct

const WelcomeMark = ({ name }) => {
  const [isLinkHovered, setIsLinkHovered] = useState(false);

  // --- Style Definitions ---

  // Main card styles (combining original Card sx and glassmorphism)
  const cardStyle = {
    height: "340px",
    paddingTop: "32px",
    paddingBottom: "32px",
    backgroundImage: `url(${gif})`,
    backgroundSize: "cover",
    backgroundPosition: "50%", // Center
    boxSizing: "border-box",

    // Glassmorphism
    backgroundColor: "rgba(0, 0, 0, 0.25)", // Darker semi-transparent overlay for better text contrast if gif is light
    backdropFilter: "blur(10px) saturate(150%)",
    WebkitBackdropFilter: "blur(10px) saturate(150%)", // For Safari
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.12)", // Lighter border for glass edge
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)", // Softer shadow

    // Layout (from original VuiBox wrapper inside Card)
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#FFFFFF", // Default text color to white, assuming gif background allows for it
  };

  // Styles for the top content section
  const topContentBoxStyle = {
    // No specific styles needed if it's just a container
  };

  // Typography style helpers
  const getTypographyStyles = (variant, color, fontWeight, mb) => {
    let styles = {
      margin: 0, // Reset default margins
      lineHeight: 1.5,
    };

    // Color
    if (color === "white") styles.color = "#FFFFFF";
    else if (color === "text") styles.color = "rgba(255, 255, 255, 0.8)"; // Lighter text, less prominent
    else styles.color = color || "inherit";

    // Font Weight
    if (fontWeight === "regular") styles.fontWeight = 400;
    else if (fontWeight === "bold") styles.fontWeight = 700;
    else styles.fontWeight = fontWeight || 400;

    // Variants (approximations)
    switch (variant) {
      case "button":
        styles.fontSize = "0.875rem";
        // styles.textTransform = "uppercase"; // Original was 'regular' for text
        break;
      case "h3":
        styles.fontSize = "2rem"; // Approx for h3
        styles.lineHeight = 1.3;
        break;
      case "h6":
        styles.fontSize = "1.1rem"; // Approx for h6
        styles.lineHeight = 1.4;
        break;
      default:
        styles.fontSize = "1rem";
    }

    // Margin Bottom
    if (mb) styles.marginBottom = mb;

    return styles;
  };

  // "Tap to record" link styles
  const linkContainerStyle = {
    // styles for the <a> tag itself
    ...getTypographyStyles("button", "white", "regular"), // Inherits base button styling
    marginRight: "5px", // from original sx
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    textDecoration: "none",
  };

  const arrowIconBaseStyle = {
    // styles for the <span> wrapping the arrow
    marginLeft: "5px", // from original Icon sx
    fontWeight: "bold", // from original Icon sx
    fontSize: "1.125rem", // from original Icon sx
    display: "inline-block", // To allow transform
    transform: "translate(2px, -0.5px)",
    transition: "transform 0.2s cubic-bezier(0.34,1.61,0.7,1.3)",
  };

  const arrowIconHoverStyle = {
    transform: "translate(6px, -0.5px)",
  };

  const combinedArrowStyle = {
    ...arrowIconBaseStyle,
    ...(isLinkHovered ? arrowIconHoverStyle : {}),
  };

  return (
    <div style={cardStyle}>
      <div style={topContentBoxStyle}> {/* Equivalent of the first VuiBox */}
        <p style={getTypographyStyles("button", "text", "regular", "12px")}>
          Welcome back,
        </p>
        <h3 style={getTypographyStyles("h3", "white", "bold", "18px")}>
          {name}
        </h3>
        <p style={getTypographyStyles("h6", "text", "regular", "auto")}>
          Glad to see you again!
          <br /> Ask me anything.
        </p>
      </div>

      {/* Equivalent of the VuiTypography link */}
      <a
        href="#" // Or appropriate href
        style={linkContainerStyle}
        onMouseEnter={() => setIsLinkHovered(true)}
        onMouseLeave={() => setIsLinkHovered(false)}
        onFocus={() => setIsLinkHovered(true)} // For accessibility
        onBlur={() => setIsLinkHovered(false)}  // For accessibility
      >
        Tap to record
        <span style={combinedArrowStyle}>
          {/* Using a Unicode arrow as Icon replacement */}
          →
        </span>
      </a>
    </div>
  );
};

export default WelcomeMark;