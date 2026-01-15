#!/usr/bin/env bash
set -euo pipefail

API_URL="http://localhost:3000/api/students"
TENANT_ID="6964310875126d77ed580e33"
SCHOOL_ID="6966c745889369b5aa4031bd"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTY0MzEwODc1MTI2ZDc3ZWQ1ODBlNWIiLCJ0ZW5hbnRJZCI6IjY5NjQzMTA4NzUxMjZkNzdlZDU4MGUzMyIsImVtYWlsIjoiYWRtaW5AZ2hhbmFzY28uY29tIiwicm9sZUlkIjoiNjk2NDJiNzI3NTEyNmQ3N2VkNTgwY2YwIiwicm9sZU5hbWUiOiJUZW5hbnQgQWRtaW4iLCJpYXQiOjE3Njg0ODkzMDEsImV4cCI6MTc2ODU3NTcwMX0.1IrQWLX4qiTUhal9mFGdxivn-aVfNo-1zvEaCY0gAYI"

common_headers=(
  -H "Authorization: Bearer ${TOKEN}"
  -H "Content-Type: application/json"
  -H "x-tenant-id: ${TENANT_ID}"
)

curl -sS "${API_URL}" \
  "${common_headers[@]}" \
  -d @- <<'JSON'
{
  "schoolId": "6966c745889369b5aa4031bd",
  "firstName": "Ama",
  "lastName": "Boateng",
  "middleName": "Yaa",
  "dateOfBirth": "2013-04-18",
  "gender": "female",
  "nationality": "Ghanaian",
  "religion": "Christianity",
  "email": "ama.boateng+student1@ghanasco.com",
  "phone": "+233201234501",
  "address": {
    "street": "12 Independence Ave",
    "city": "Accra",
    "state": "Greater Accra",
    "postalCode": "GA-123",
    "country": "Ghana"
  },
  "guardians": [
    {
      "name": "Kwame Boateng",
      "relationship": "father",
      "phone": "+233201111111",
      "email": "kwame.boateng@ghanasco.com",
      "occupation": "Accountant",
      "isPrimary": true,
      "isEmergencyContact": true
    },
    {
      "name": "Efua Boateng",
      "relationship": "mother",
      "phone": "+233201111112",
      "email": "efua.boateng@ghanasco.com",
      "occupation": "Teacher",
      "isPrimary": false,
      "isEmergencyContact": false
    }
  ],
  "medicalInfo": {
    "bloodGroup": "O+",
    "allergies": ["Peanuts"],
    "medicalConditions": [],
    "medications": [],
    "doctorName": "Dr. Mensah",
    "doctorPhone": "+233202000001",
    "insuranceProvider": "NHIS",
    "insuranceNumber": "NHIS-445566"
  },
  "enrollment": {
    "admissionNumber": "ADM-2024-1001",
    "admissionDate": "2024-09-02",
    "academicYear": "2024/2025",
    "class": "JSS1",
    "section": "A",
    "rollNumber": "JSS1-A-12",
    "previousSchool": "Sunrise Academy",
    "previousClass": "Primary 6"
  }
}
JSON

echo

curl -sS "${API_URL}" \
  "${common_headers[@]}" \
  -d @- <<'JSON'
{
  "schoolId": "6966c745889369b5aa4031bd",
  "firstName": "Kojo",
  "lastName": "Mensah",
  "dateOfBirth": "2012-11-05",
  "gender": "male",
  "nationality": "Ghanaian",
  "religion": "Christianity",
  "email": "kojo.mensah+student2@ghanasco.com",
  "phone": "+233201234502",
  "address": {
    "street": "8 High Street",
    "city": "Kumasi",
    "state": "Ashanti",
    "postalCode": "AK-204",
    "country": "Ghana"
  },
  "guardians": [
    {
      "name": "Akosua Mensah",
      "relationship": "mother",
      "phone": "+233201222221",
      "email": "akosua.mensah@ghanasco.com",
      "occupation": "Nurse",
      "isPrimary": true,
      "isEmergencyContact": true
    }
  ],
  "medicalInfo": {
    "bloodGroup": "A+",
    "allergies": [],
    "medicalConditions": ["Asthma"],
    "medications": ["Inhaler"],
    "doctorName": "Dr. Owusu",
    "doctorPhone": "+233202000002",
    "insuranceProvider": "Medicare",
    "insuranceNumber": "MED-778899"
  },
  "enrollment": {
    "admissionNumber": "ADM-2024-1002",
    "admissionDate": "2024-09-03",
    "academicYear": "2024/2025",
    "class": "JSS2",
    "section": "B",
    "rollNumber": "JSS2-B-07",
    "previousSchool": "Legacy Prep",
    "previousClass": "JSS1"
  }
}
JSON

echo

curl -sS "${API_URL}" \
  "${common_headers[@]}" \
  -d @- <<'JSON'
{
  "schoolId": "6966c745889369b5aa4031bd",
  "firstName": "Yvonne",
  "lastName": "Addo",
  "middleName": "Serwaa",
  "dateOfBirth": "2011-07-21",
  "gender": "female",
  "nationality": "Ghanaian",
  "religion": "Islam",
  "email": "yvonne.addo+student3@ghanasco.com",
  "phone": "+233201234503",
  "address": {
    "street": "22 Airport Road",
    "city": "Tema",
    "state": "Greater Accra",
    "postalCode": "TM-318",
    "country": "Ghana"
  },
  "guardians": [
    {
      "name": "Hassan Addo",
      "relationship": "guardian",
      "phone": "+233201333331",
      "email": "hassan.addo@ghanasco.com",
      "occupation": "Engineer",
      "isPrimary": true,
      "isEmergencyContact": true
    },
    {
      "name": "Aisha Addo",
      "relationship": "guardian",
      "phone": "+233201333332",
      "email": "aisha.addo@ghanasco.com",
      "occupation": "Entrepreneur",
      "isPrimary": false,
      "isEmergencyContact": false
    }
  ],
  "medicalInfo": {
    "bloodGroup": "B+",
    "allergies": ["Dust"],
    "medicalConditions": [],
    "medications": [],
    "doctorName": "Dr. Sarpong",
    "doctorPhone": "+233202000003",
    "insuranceProvider": "NHIS",
    "insuranceNumber": "NHIS-990011"
  },
  "enrollment": {
    "admissionNumber": "ADM-2024-1003",
    "admissionDate": "2024-09-04",
    "academicYear": "2024/2025",
    "class": "SS1",
    "section": "C",
    "rollNumber": "SS1-C-05",
    "previousSchool": "Bright Future",
    "previousClass": "JSS3"
  }
}
JSON

echo
