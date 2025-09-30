#Language: en
# encoding: UTF-8

Feature: Simple Docker Static File Server
  To serve files over HTTP
  As a User
  I want to start a simple file server and be able to access it

  Scenario: Starting the file server and accessing a file
    Given a directory "test-directory" exists with the file "example.txt"
    And the file server is started in the directory "test-directory" on port 8000
    When I access the URL "http://localhost:8000/example.txt" in the browser
    Then I should see the content of the file "example.txt"

  Scenario: Accessing a non-existent file
    Given a directory "test-directory" exists without the file "non-existent.txt"
    And the file server is started in the directory "test-directory" on port 8000
    When I access the URL "http://localhost:8000/non-existent.txt" in the browser
    Then I should see a 404 error message

  Scenario: Stopping the file server
    Given the file server is running in the directory "test-directory" on port 8000
    When I stop the file server
    Then the server should no longer be accessible at "http://localhost:8000"