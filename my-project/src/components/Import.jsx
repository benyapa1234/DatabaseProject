import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function Import() {
  const [excelData, setExcelData] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [patientCount, setPatientCount] = useState('');

  // Function to format date into YYYY-MM-DD
  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') {
      return ''; // Return empty string if no data or not a string
    }

    const dateParts = dateStr.split('/');
    if (dateParts.length === 3) {
      const month = dateParts[0].padStart(2, '0');
      const day = dateParts[1].padStart(2, '0');
      const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr; // If not the expected format, return as is
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json(firstSheet);

      const formattedData = excelRows.map(row => ({
        ...row,
        date: formatDate(row.date),
      }));

      setExcelData(formattedData);
      setUserMessage('File uploaded successfully. You can review the data below.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (selectedDate === '' && patientCount === '' && excelData.length === 0) {
      setUserMessage('Please select a date and enter the number of patients, or upload an Excel file.');
      return;
    }

    let updatedData = [...excelData];

    // If manual data is provided, add it as a new entry
    if (selectedDate !== '' && patientCount !== '') {
      const newEntry = { date: selectedDate, patient_data: patientCount };
      updatedData = [...updatedData, newEntry];
    }

    const ws = XLSX.utils.json_to_sheet(updatedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const formData = new FormData();
    formData.append('file', new Blob([excelBuffer]), 'data.xlsx');

    try {
      const response = await fetch('http://localhost:3000/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
        mode: 'cors',
      });

      if (response.ok) {
        setUserMessage('Data inserted successfully.');
        setExcelData([]);
        setSelectedDate('');
        setPatientCount('');
      } else {
        const errorData = await response.json();
        setUserMessage('Failed to insert data: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error inserting data:', error);
      setUserMessage('An error occurred while inserting data.');
    }
  };

  return (
    <div className="upload-container">
      <h1 className="header">Upload COVID-19 Data</h1>

      {/* Date Picker */}
      <div className="input-group">
        <label htmlFor="date">Select Date:</label>
        <input 
          type="date" 
          id="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
      </div>

      {/* Input for Patient Count */}
      <div className="input-group">
        <label htmlFor="patientCount">Enter Number of Patients:</label>
        <input 
          type="number" 
          id="patientCount" 
          value={patientCount} 
          onChange={(e) => setPatientCount(e.target.value)} 
        />
      </div>

      {/* File Upload */}
      <div className="input-group">
        <label htmlFor="fileUpload">Upload Excel File:</label>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          id="fileUpload"
        />
      </div>

      {/* Submit Button */}
      <button className="submit-button" onClick={handleSubmit}>
        Submit Data
      </button>
      
      {/* Display User Message */}
      {userMessage && <p className="user-message">{userMessage}</p>}

      {/* Display Data Table */}
      {excelData.length > 0 && (
        <div className="data-table">
          <h2 style={{ color: 'green' }}>Uploaded Data ({excelData.length} rows)</h2>
          <table>
            <thead>
              <tr>
                {Object.keys(excelData[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Import;
