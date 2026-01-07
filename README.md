This application provides image storage functionality through Google Cloud Storage integration. Users authenticate through the system and upload images based on their assigned roles.
User data is stored in MongoDB, while images are organized in Google Cloud Storage using prefix-based folders for each user.The system implements security through role-based permissions 
at the application level and IAM policies at the Google Cloud level.This ensures that users can only access and modify their authorized resources. The prefix structure keeps user files 
organized and separated within the cloud storage buckets.

Technologies Used

MongoDB - User data and role management
Express.js - Backend API
React - Frontend interface
Node.js - Server runtime
Google Cloud Storage - Image storage
Google IAM - Access control policies

Key Features
The application handles user authentication and assigns specific roles that determine upload permissions. Each user receives a dedicated storage folder identified by prefix,
maintaining organized file structure. IAM policies enforce restrictions at the cloud infrastructure level, preventing unauthorized operations on storage resources
