<?php
// Database connection
$host = "localhost";
$user = "hdadmin_sfm";
$password = "25Y7Pwsd6UKEh4kTEsAC";
$database = "hdadmin_sfm";

// Create connection
$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Add website column to startups table
$sql = "ALTER TABLE startups ADD COLUMN website VARCHAR(255)";

// Execute query
if ($conn->query($sql) === TRUE) {
    echo "Website column added successfully to startups table";
} else {
    // If there's an error (like column already exists), try a different approach
    if (strpos($conn->error, "Duplicate column") !== false) {
        echo "Column already exists. No changes needed.";
    } else {
        echo "Error adding column: " . $conn->error;
    }
}

$conn->close();
?> 