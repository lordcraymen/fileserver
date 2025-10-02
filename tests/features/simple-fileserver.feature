#Language: en
# encoding: UTF-8

Feature: Simple Docker Static File Server
  To serve files over HTTP from a local directory
  As a Docker User
  I want to start a simple file server and be able to access it

  Scenario: Starting the file server and accessing a file
    Given a directory "www" exists with the file "index.html"
    And the file server is started in the directory "www" on a port 8080
    When I access the URL "http://localhost:8080/index.html" with a GET request
    Then I should see the content of the file "index.html"

  Scenario: Accessing a non-existent file
    Given a directory "www" exists without the file "non-existent.html"
    And the file server is started in the directory "www" on a port 8080
    When I access the URL "http://localhost:8080/non-existent.html" with a GET request
    Then I should see a 404 error message