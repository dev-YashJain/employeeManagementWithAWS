import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [loc, setLoc] = useState('');
  const [image, setImage] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Upload the image to S3
      const formData = new FormData();
      formData.append('file', image);

      // Use the EC2 public IP and port for the backend
      const s3Response = await axios.post('http://3.106.230.156:5500/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = s3Response.data.url; // Get the image URL from S3 response

      // Step 2: Insert employee data into RDS along with the image URL
      const empData = {
        empId,
        name,
        primarySkill,
        loc,
        imageUrl,
      };

      // Use the EC2 public IP and port for the backend
      await axios.post('http://3.106.230.156:5500/api/emp', empData);

      alert('Employee data submitted successfully!');
      // Reset form fields
      setEmpId('');
      setName('');
      setPrimarySkill('');
      setLoc('');
      setImage(null);
    } catch (err) {
      console.error('Error submitting data:', err);
      alert('Failed to submit data.');
    }
  };

  return (
    <div>
      <h1>Employee Data Form</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input 
            type="text" 
            placeholder="Emp ID" 
            value={empId} 
            onChange={(e) => setEmpId(e.target.value)} 
            required
          />
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
          />
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Primary Skill" 
            value={primarySkill} 
            onChange={(e) => setPrimarySkill(e.target.value)} 
            required
          />
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Location" 
            value={loc} 
            onChange={(e) => setLoc(e.target.value)} 
            required
          />
        </div>
        <div>
          <input 
            type="file" 
            onChange={(e) => setImage(e.target.files[0])} 
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default App;
