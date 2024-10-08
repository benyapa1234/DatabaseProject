// ./components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";

const Dashboard = () => {
  const [dbData, setDbData] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [topN, setTopN] = useState("10"); // Default to Top 10
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/getdata");
        const data = await response.json();
        setDbData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    setFilterDate(e.target.value);
  };

  const handleTopNChange = (e) => {
    setTopN(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Group data by date and sum patient_data
  const groupedData = dbData.reduce((acc, curr) => {
    const existing = acc.find((item) => item.date === curr.date);
    if (existing) {
      existing.patient_data += curr.patient_data;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []);

  const searchedData = groupedData.filter((row) =>
    row.date.includes(searchQuery)
  );

  let filteredData = searchedData
    .filter((row) => (filterDate ? row.date === filterDate : true))
    .sort((a, b) => b.patient_data - a.patient_data);

  if (topN !== "All") {
    filteredData = filteredData.slice(0, parseInt(topN));
  }

  const uniqueDates = Array.from(
    new Set(filteredData.map((row) => row.date))
  ).sort();

  const chartData = [
    [
      { type: "date", label: "Date" },
      { type: "number", label: "Cumulative Cases" },
    ],
    ...filteredData.map((row) => [
      new Date(row.date),
      Number(row.patient_data),
    ]),
  ];

  const pieChartData = [
    ["Region", "Cases"],
    ...filteredData.map((row) => [
      row.region === undefined || row.region === "Unknown"
        ? row.date
        : row.region,
      Number(row.patient_data),
    ]),
  ];

  const diffChartData = [
    ["Date", "Cases", "Previous Cases"],
    ...filteredData.map((row, index) => [
      new Date(row.date),
      Number(row.patient_data),
      index > 0 ? Number(filteredData[index - 1].patient_data) : 0,
    ]),
  ];

  const handleChartClick = (chartWrapper) => {
    const chart = chartWrapper.getChart();
    const dataTable = chartWrapper.getDataTable();

    google.visualization.events.addListener(chart, "select", () => {
      const selection = chart.getSelection();
      if (selection.length > 0) {
        const row = selection[0].row;
        const date = dataTable.getValue(row, 0);
        setSelectedDate(date.toISOString().split("T")[0]);
      }
    });
  };

  return (
    <div className="container">
      <h1 className="header" style={{ color: "white" }}>
        COVID-19 Data Visualization
      </h1>
      <div className="filter-section">
        <select value={filterDate} onChange={handleFilterChange}>
          <option value="">Select a date (or leave empty for all dates)</option>
          {uniqueDates.map((date, index) => (
            <option key={index} value={date}>
              {date}
            </option>
          ))}
        </select>

        <select value={topN} onChange={handleTopNChange}>
          <option value="All">All</option>
          <option value="1">Top 1</option>
          <option value="10">Top 10</option>
          <option value="50">Top 50</option>
          <option value="100">Top 100</option>
          <option value="500">Top 500</option>
        </select>

        <input
          type="text"
          placeholder="Search by date (YYYY-MM-DD)"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="chart-section">
        <div className="chart-row">
          <Chart
            chartType="LineChart"
            width="100%"
            height="400px"
            data={chartData}
            options={{
              title: "COVID-19 Cumulative Cases",
              hAxis: { title: "Date" },
              vAxis: { title: "Cumulative Cases" },
            }}
            chartEvents={[
              {
                eventName: "ready",
                callback: ({ chartWrapper }) => handleChartClick(chartWrapper),
              },
            ]}
          />
        </div>
        <div className="chart-row">
          <Chart
            chartType="BarChart"
            width="100%"
            height="400px"
            data={chartData}
            options={{
              title: "COVID-19 Bar Chart",
              hAxis: { title: "Date" },
              vAxis: { title: "Cumulative Cases" },
            }}
          />
        </div>
        <div className="chart-row">
          <Chart
            chartType="AreaChart"
            width="100%"
            height="400px"
            data={chartData}
            options={{
              title: "COVID-19 Area Chart",
              isStacked: true,
              hAxis: { title: "Date", format: "MMM dd, yyyy" },
              vAxis: { title: "Cumulative Cases", minValue: 0 },
              colors: ["#4285F4"],
              backgroundColor: "#f1f1f1",
              legend: { position: "top" },
              areaOpacity: 0.4,
            }}
          />
        </div>

        <div className="chart-row">
          <Chart
            chartType="ComboChart"
            width="100%"
            height="400px"
            data={diffChartData}
            options={{
              title: "COVID-19 Diff Chart",
              vAxis: { title: "Cumulative Cases" },
              hAxis: { title: "Date" },
              seriesType: "bars",
              series: { 1: { type: "line" } },
              backgroundColor: "#f1f1f1",
            }}
          />
        </div>
        <div className="chart-row">
          <Chart
            chartType="PieChart"
            width="100%"
            height="400px"
            data={pieChartData}
            options={{
              title: "COVID-19 Cases by Region",
              slices: {
                0: { offset: 0.1 }, // Offset the first slice
              },
              colors: ["#FF5733", "#34A853", "#4285F4", "#FBBC05", "#B9FBC0"],
            }}
          />
        </div>

        <div className="chart-container data-table">
          {/* <h2 style={{ color: 'black' }} >Cases by Region</h2> */}
          <table className="styled-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Cases</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  <td>
                    {row.region === undefined || row.region === "Unknown"
                      ? row.date
                      : row.region}
                  </td>
                  <td>{row.patient_data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDate && (
        <div className="drilldown-section">
          <h2>Details for {selectedDate}</h2>
          <ul>{/* Display additional details here */}</ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
