<?php
// MySQL credentials
$host = 'localhost';
$username = 'hdadmin_sfm';
$password = '25Y7Pwsd6UKEh4kTEsAC';
$database = 'hdadmin_sfm';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// SQL to add the website column
$sql = "ALTER TABLE startups ADD COLUMN website VARCHAR(255);";

// Execute the SQL command
if ($conn->query($sql) === TRUE) {
  echo "Website column added successfully to startups table";
} else {
  echo "Error adding website column: " . $conn->error;
}

// Close connection
$conn->close();
?> 