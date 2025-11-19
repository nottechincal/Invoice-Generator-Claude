"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface TimeEntry {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_company_name?: string;
  project_name?: string;
  task_description: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  hourly_rate?: number;
  billable: boolean;
  invoiced: boolean;
}

export default function TimeTrackingPage() {
  const { data: session } = useSession();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    projectName: "",
    taskDescription: "",
    startTime: new Date().toISOString().slice(0, 16),
    endTime: "",
    hourlyRate: "100",
    billable: true,
    notes: "",
  });

  useEffect(() => {
    fetchTimeEntries();
    fetchCustomers();
  }, [session]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch("/api/time-entries");
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data);

        // Check if there's a running timer
        const running = data.find((entry: TimeEntry) => !entry.end_time);
        if (running) {
          setIsRunning(true);
          setRunningId(running.id);
          setStartTime(new Date(running.start_time));
          setFormData((prev) => ({
            ...prev,
            customerId: running.customer_id || "",
            projectName: running.project_name || "",
            taskDescription: running.task_description,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const startTimer = async () => {
    if (!formData.taskDescription) {
      alert("Please enter a task description");
      return;
    }

    try {
      const now = new Date();
      setStartTime(now);
      setElapsedSeconds(0);
      setIsRunning(true);

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId || null,
          projectName: formData.projectName || null,
          taskDescription: formData.taskDescription,
          startTime: now.toISOString(),
          hourlyRate: parseFloat(formData.hourlyRate),
          billable: formData.billable,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start timer");
      }

      fetchTimeEntries();
    } catch (error) {
      console.error("Start timer error:", error);
      alert("Failed to start timer");
      setIsRunning(false);
      setStartTime(null);
    }
  };

  const stopTimer = async () => {
    if (!runningId) return;

    try {
      const response = await fetch("/api/time-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: runningId,
          endTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop timer");
      }

      setIsRunning(false);
      setRunningId(null);
      setStartTime(null);
      setElapsedSeconds(0);
      setFormData((prev) => ({
        ...prev,
        taskDescription: "",
        projectName: "",
      }));

      fetchTimeEntries();
    } catch (error) {
      console.error("Stop timer error:", error);
      alert("Failed to stop timer");
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId || null,
          projectName: formData.projectName || null,
          taskDescription: formData.taskDescription,
          startTime: formData.startTime,
          endTime: formData.endTime,
          hourlyRate: parseFloat(formData.hourlyRate),
          billable: formData.billable,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add time entry");
      }

      setShowAddModal(false);
      setFormData({
        customerId: "",
        projectName: "",
        taskDescription: "",
        startTime: new Date().toISOString().slice(0, 16),
        endTime: "",
        hourlyRate: "100",
        billable: true,
        notes: "",
      });

      fetchTimeEntries();
      alert("Time entry added successfully!");
    } catch (error) {
      alert("Failed to add time entry");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const calculateEarnings = (minutes?: number, rate?: number) => {
    if (!minutes || !rate) return "$0.00";
    const hours = minutes / 60;
    return `$${(hours * rate).toFixed(2)}`;
  };

  const totalMinutes = timeEntries
    .filter((e) => e.duration_minutes)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  const totalEarnings = timeEntries
    .filter((e) => e.duration_minutes && e.hourly_rate)
    .reduce(
      (sum, e) =>
        sum + ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0),
      0
    );

  const billableEarnings = timeEntries
    .filter((e) => e.billable && e.duration_minutes && e.hourly_rate)
    .reduce(
      (sum, e) =>
        sum + ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0),
      0
    );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <p style={{ color: "#6b7280" }}>Loading time entries...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Time Tracking
          </h1>
          <p style={{ color: "#6b7280" }}>
            Track billable hours and generate invoices
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            color: "#374151",
            cursor: "pointer",
          }}
        >
          + Manual Entry
        </button>
      </div>

      {/* Timer Widget */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: isRunning ? "2px solid #10b981" : "1px solid #e5e7eb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              color: isRunning ? "#10b981" : "#1f2937",
              marginBottom: "1rem",
              fontFamily: "monospace",
            }}
          >
            {formatTime(elapsedSeconds)}
          </div>

          {!isRunning ? (
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <input
                type="text"
                value={formData.taskDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    taskDescription: e.target.value,
                  }))
                }
                placeholder="What are you working on?"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  color: "#1f2937",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  marginBottom: "1rem",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerId: e.target.value,
                    }))
                  }
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="">No customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName || customer.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projectName: e.target.value,
                    }))
                  }
                  placeholder="Project name"
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                />

                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hourlyRate: e.target.value,
                    }))
                  }
                  placeholder="Hourly rate"
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={startTimer}
                style={{
                  padding: "1rem 3rem",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ▶ Start Timer
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: "1.125rem",
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                {formData.taskDescription}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "1.5rem",
                }}
              >
                {formData.projectName && `${formData.projectName} • `}
                {formData.customerId &&
                  customers.find((c) => c.id === formData.customerId)
                    ?.companyName}
              </div>
              <button
                onClick={stopTimer}
                style={{
                  padding: "1rem 3rem",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ⏹ Stop Timer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total Hours</p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginTop: "0.5rem",
            }}
          >
            {formatDuration(totalMinutes)}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Total Earnings
          </p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginTop: "0.5rem",
            }}
          >
            ${totalEarnings.toFixed(2)}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Billable Earnings
          </p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#10b981",
              marginTop: "0.5rem",
            }}
          >
            ${billableEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Time Entries Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead
            style={{
              backgroundColor: "#f9fafb",
              borderBottom: "2px solid #e5e7eb",
            }}
          >
            <tr>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Date
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Task
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Customer
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "right",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Duration
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "right",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Rate
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "right",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.map((entry) => (
              <tr
                key={entry.id}
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
                <td style={{ padding: "1rem", color: "#6b7280" }}>
                  {new Date(entry.start_time).toLocaleDateString()}
                </td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: "500", color: "#1f2937" }}>
                    {entry.task_description}
                  </div>
                  {entry.project_name && (
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {entry.project_name}
                    </div>
                  )}
                </td>
                <td style={{ padding: "1rem", color: "#6b7280" }}>
                  {entry.customer_company_name || entry.customer_name || "-"}
                </td>
                <td
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    fontWeight: "500",
                    color: "#1f2937",
                  }}
                >
                  {formatDuration(entry.duration_minutes)}
                </td>
                <td
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    color: "#6b7280",
                  }}
                >
                  {entry.hourly_rate ? `$${entry.hourly_rate}/hr` : "-"}
                </td>
                <td
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {calculateEarnings(entry.duration_minutes, entry.hourly_rate)}
                </td>
                <td style={{ padding: "1rem", textAlign: "center" }}>
                  {entry.invoiced ? (
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      Invoiced
                    </span>
                  ) : entry.billable ? (
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        backgroundColor: "#d1fae5",
                        color: "#065f46",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      Billable
                    </span>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                      Non-billable
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "1.5rem",
              }}
            >
              Add Manual Time Entry
            </h2>

            <form onSubmit={handleManualEntry}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Task Description *
                  </label>
                  <input
                    type="text"
                    value={formData.taskDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        taskDescription: e.target.value,
                      }))
                    }
                    required
                    placeholder="What did you work on?"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      color: "#1f2937",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Customer
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerId: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      color: "#1f2937",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  >
                    <option value="">No customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName || customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          projectName: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hourlyRate: e.target.value,
                        }))
                      }
                      step="0.01"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                    marginTop: "1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#667eea",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
