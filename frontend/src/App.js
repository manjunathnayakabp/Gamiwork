import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, // For Radar
  AreaChart, Area, // For Area
  ScatterChart, Scatter, ZAxis, CartesianGrid, XAxis, YAxis, Tooltip // For Scatter
} from 'recharts';
import { Briefcase, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    // Fetch user list for the dropdown
    axios.get(`${API_URL}/users`).then(res => setUserList(res.data));
  }, []);

  if (!currentUser) {
    return <LoginScreen users={userList} onLogin={setCurrentUser} />;
  }

  return currentUser.role === 'Manager'
    ? <ManagerDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />
    : <EmployeeDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />;
}

// --- 1. LOGIN SCREEN ---
function LoginScreen({ users, onLogin }) {
  const [selectedId, setSelectedId] = useState('');
  const managers = users.filter(u => u.role === 'Manager');
  const employees = users.filter(u => u.role === 'Employee');

  const handleLogin = () => {
    const user = users.find(u => u.id === parseInt(selectedId));
    if(user) onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex flex-col items-center justify-center p-4">
      
      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">GamiWork</h1>
        <p className="text-gray-500 text-center mb-8">Gamified Engineering Analytics</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Manager</label>
            <select onChange={(e) => setSelectedId(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50">
              <option value="">-- Choose Manager --</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="text-center text-gray-400">- OR -</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <select onChange={(e) => setSelectedId(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50">
              <option value="">-- Choose Employee --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedId}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            Enter Dashboard
          </button>
        </div>
      </div>

      {/* --- ADDED TEAM SECTION HERE --- */}
      <TeamSection />

    </div>
  );
}

// --- 2. EMPLOYEE DASHBOARD ---
function EmployeeDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/employee/${user.id}`).then(res => setData(res.data));
  }, [user.id]);

  const markComplete = async (taskId) => {
    try {
        await axios.patch(`${API_URL}/tasks/${taskId}`, { status: 'Completed' });
        // Refresh Data
        const res = await axios.get(`${API_URL}/employee/${user.id}`);
        setData(res.data);
    } catch (err) { alert("Error updating task"); }
  };

  if (!data) return <div className="p-10">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Briefcase size={16}/> Manager: <span className="font-semibold text-indigo-600">{data.profile.manager_name}</span>
            </p>
        </div>
        <button onClick={onLogout} className="text-red-500 hover:text-red-700">Logout</button>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Deployment Frequency" value={data.dora?.deployment_freq?.toFixed(1) + "/wk"} icon={<TrendingUp />} color="blue" />
            <StatCard title="Change Failure Rate" value={data.dora?.change_failure_rate?.toFixed(1) + "%"} icon={<CheckCircle />} color="green" />
            <StatCard title="Lead Time" value={data.dora?.lead_time?.toFixed(0) + " hrs"} icon={<Calendar />} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tasks Section */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-indigo-600" /> Pending Work
                </h2>
                <div className="space-y-4">
                    {data.tasks.map(task => (
                        <div key={task.id} className={`p-4 border border-gray-100 rounded-lg transition 
                            ${task.status === 'Completed' ? 'bg-green-50 opacity-70' : 'bg-white shadow hover:shadow-md'}`}>
                            
                            <div className="flex justify-between items-start">
                                <h4 className={`font-semibold ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {task.title}
                                </h4>
                                {task.status !== 'Completed' && (
                                    <button 
                                        onClick={() => markComplete(task.id)}
                                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                    >
                                        Mark Done
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-2 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                    ${task.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {task.status}
                                </span>
                                <span className="text-gray-400 text-xs">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
            {/* 1. Skill Radar */}
            <SkillRadar dora={data.dora} activities={[]} />
            
            {/* 2. XP Growth */}
            <XPGrowthChart />
        </div>
        </div>
      </main>
    </div>
  );
}

// --- 3. MANAGER DASHBOARD ---
function ManagerDashboard({ user, onLogout }) {
  const [team, setTeam] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(null); // TRACK SELECTION
  const [selectedEmpData, setSelectedEmpData] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/manager/${user.id}`).then(res => setTeam(res.data.team));
  }, [user.id]);

  // Fetch individual data when an employee is clicked
  useEffect(() => {
    if (selectedEmpId) {
      axios.get(`${API_URL}/employee/${selectedEmpId}`).then(res => setSelectedEmpData(res.data));
    }
  }, [selectedEmpId]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-indigo-900 text-white p-6 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
             <Briefcase /> Manager Hub
          </h1>
          <p className="opacity-80 text-sm">Managing Team: {user.department}</p>
        </div>
        <button onClick={onLogout} className="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-600 transition">Logout</button>
      </header>

      <main className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Employee List (Interactive) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Your Squad</h2>
          <div className="space-y-3 h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {team.map(emp => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border
                  ${selectedEmpId === emp.id
                    ? 'bg-indigo-600 text-white shadow-xl scale-105 border-indigo-600'
                    : 'bg-white hover:bg-indigo-50 border-gray-100 shadow-sm'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{emp.name}</h3>
                    <div className="text-xs opacity-80 mt-1 uppercase tracking-wider">{emp.department}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${selectedEmpId === emp.id ? 'bg-indigo-500' : 'bg-green-100 text-green-700'}`}>
                    {(emp.points || 0)} PTS
                  </div>
                </div>
                {/* Mini Progress Bar */}
                <div className="mt-3 h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                   <div className="h-full bg-green-400" style={{width: `${Math.min((emp.points || 0)/20, 100)}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: The Dynamic Display */}
        <div className="lg:col-span-2">

          {selectedEmpId && selectedEmpData ? (
            // --- VIEW 1: INDIVIDUAL EMPLOYEE ANALYTICS ---
            <div className="space-y-6 animate-fade-in-up">
              <button
                onClick={() => setSelectedEmpId(null)}
                className="mb-4 text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                ← Back to Team Overview
              </button>

              <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-indigo-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedEmpData.profile.name}</h2>
                        <p className="text-gray-500">{selectedEmpData.profile.role} • {selectedEmpData.profile.department}</p>
                    </div>
                    {/* New Badge Feature */}
                    <BadgeCase points={selectedEmpData.dora?.deployment_freq * 100} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkillRadar dora={selectedEmpData.dora} activities={[]} />
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-gray-700 mb-4">Current Assignments</h3>
                    <ul className="space-y-3">
                        {selectedEmpData.tasks.map(t => (
                            <li key={t.id} className="text-sm p-3 bg-gray-50 rounded border flex justify-between">
                                <span>{t.title}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {t.status}
                                </span>
                            </li>
                        ))}
                        {selectedEmpData.tasks.length === 0 && <p className="text-gray-400 italic">No active tasks.</p>}
                    </ul>
                </div>
              </div>
            </div>

          ) : (
            // --- VIEW 2: GENERAL TEAM OVERVIEW ---
            <div className="space-y-8 animate-fade-in-up">
              <TeamVelocityChart teamData={team} />

              <div className="grid grid-cols-1 gap-6">
                <TaskAssignmentForm team={team} />
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                  <div className="bg-indigo-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="text-3xl font-bold">{team.length}</div>
                      <div className="text-sm opacity-80">Active Engineers</div>
                  </div>
                  <div className="bg-purple-600 text-white p-4 rounded-xl shadow-lg">
                      <div className="text-3xl font-bold">{team.reduce((acc, curr) => acc + (curr.points || 0), 0).toLocaleString()}</div>
                      <div className="text-sm opacity-80">Total Sprint Points</div>
                  </div>
                  <div className="bg-pink-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="text-3xl font-bold">98.5%</div>
                      <div className="text-sm opacity-80">Success Rate</div>
                  </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600"
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
            <div className={`p-4 rounded-full ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

// --- NEW COMPONENT: Task Assignment Form ---
function TaskAssignmentForm({ team }) {
  const [taskData, setTaskData] = useState({
    user_id: '',
    title: '',
    deadline: '',
    priority: 'Medium'
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskData.user_id) {
        setMessage('Please select an employee.');
        return;
    }

    try {
      await axios.post(`${API_URL}/tasks`, taskData);
      setMessage('✅ Task assigned successfully!');
      // Reset form (keep user selected for convenience)
      setTaskData({ ...taskData, title: '', deadline: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to assign task.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Briefcase className="text-indigo-600" /> Assign New Work
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Employee */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Assign To:</label>
            <select 
                className="w-full p-2 border rounded mt-1 bg-gray-50"
                value={taskData.user_id}
                onChange={e => setTaskData({...taskData, user_id: e.target.value})}
                required
            >
                <option value="">-- Select Team Member --</option>
                {team.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
            </select>
        </div>

        {/* Task Title */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Task Description:</label>
            <input 
                type="text" 
                placeholder="e.g. Fix login API latency"
                className="w-full p-2 border rounded mt-1"
                value={taskData.title}
                onChange={e => setTaskData({...taskData, title: e.target.value})}
                required
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Deadline */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Deadline:</label>
                <input 
                    type="date" 
                    className="w-full p-2 border rounded mt-1"
                    value={taskData.deadline}
                    onChange={e => setTaskData({...taskData, deadline: e.target.value})}
                    required
                />
            </div>

            {/* Priority */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Priority:</label>
                <select 
                    className="w-full p-2 border rounded mt-1"
                    value={taskData.priority}
                    onChange={e => setTaskData({...taskData, priority: e.target.value})}
                >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                </select>
            </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-bold transition">
            Assign Task
        </button>

        {message && <p className="text-center text-sm font-bold mt-2 animate-pulse">{message}</p>}
      </form>
    </div>
  );
}

// --- NEW COMPONENT: Skill Radar Chart ---
function SkillRadar({ dora, activities }) {
  // Normalize data to a 0-100 scale for the graph
  const data = [
    { subject: 'Speed (Deploy Freq)', A: Math.min(dora.deployment_freq * 10, 100), fullMark: 100 },
    { subject: 'Quality (Low Fail Rate)', A: Math.max(100 - (dora.change_failure_rate * 5), 0), fullMark: 100 },
    { subject: 'Volume (PRs)', A: 85, fullMark: 100 }, // Mocked based on activity
    { subject: 'Collaboration (Reviews)', A: 65, fullMark: 100 }, // Mocked
    { subject: 'Consistency', A: 90, fullMark: 100 },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center">
      <h3 className="text-lg font-bold text-gray-700 mb-2">Developer Stats Profile</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="My Stats"
              dataKey="A"
              stroke="#8884d8"
              strokeWidth={3}
              fill="#8884d8"
              fillOpacity={0.5}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-center text-gray-500 mt-2">
        This shape defines your "Persona". Wide shapes indicate generalists; sharp spikes indicate specialists.
      </p>
    </div>
  );
}

// --- NEW COMPONENT: XP Growth Area Chart ---
function XPGrowthChart() {
  // Mock trend data
  const data = [
    { name: 'Week 1', points: 400 },
    { name: 'Week 2', points: 700 },
    { name: 'Week 3', points: 1200 },
    { name: 'Week 4', points: 1800 },
    { name: 'Week 5', points: 2450 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-700 mb-4">Season Point Progression</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area 
                type="monotone" 
                dataKey="points" 
                stroke="#4F46E5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPoints)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- NEW COMPONENT: Glowing Team Chart ---
function TeamVelocityChart({ teamData }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-50">
      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
        <TrendingUp className="text-indigo-600" /> Team Velocity (Season Trend)
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={teamData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
            <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} />
            <YAxis tick={{fill: '#6b7280'}} axisLine={false} />
            <Tooltip 
                contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                cursor={{stroke: '#6366f1', strokeWidth: 2}}
            />
            <Area 
                type="monotone" 
                dataKey="points" 
                stroke="#4f46e5" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- NEW COMPONENT: Badge Showcase ---
function BadgeCase({ points }) {
  const badges = [
    { name: "Novice", min: 0, icon: "🌱", color: "bg-gray-100 text-gray-600" },
    { name: "Code Ninja", min: 500, icon: "🥷", color: "bg-blue-100 text-blue-600" },
    { name: "Architect", min: 1000, icon: "🏛️", color: "bg-purple-100 text-purple-600" },
    { name: "Grandmaster", min: 2000, icon: "👑", color: "bg-yellow-100 text-yellow-600" },
  ];

  const safePoints = points || 0;

  return (
    <div className="flex gap-2 mt-2">
      {badges.map((b) => (
        <div key={b.name} className={`flex flex-col items-center p-2 rounded-lg ${safePoints >= b.min ? b.color : 'opacity-30 grayscale'}`} style={{minWidth: '60px'}}>
          <span className="text-2xl">{b.icon}</span>
          <span className="text-[10px] font-bold uppercase">{b.name}</span>
        </div>
      ))}
    </div>
  );
}

// --- NEW COMPONENT: Team/Contributors Section ---
function TeamSection() {
  const team = [
    { name: "MANJUNATH NAYAKA B P", usn: "1RV23CS129", role: "Backend Developer" },
    { name: "PRAJWAL N", usn: "1RV23CS170", role: "Backend Developer" },
    { name: "NAMITA HIREMATH", usn: "1RV23CS145", role: "Frontend Developer" },
  ];

  return (
    <div className="mt-12 w-full max-w-4xl">
      <h3 className="text-center text-white/80 uppercase tracking-widest text-sm font-semibold mb-6">
        Developed By
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {team.map((member, index) => (
          <div key={index} className="flex flex-col items-center group bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition transform group-hover:scale-105">
            <h4 className="text-white font-bold text-lg text-center mb-2">{member.name}</h4>
            <p className="text-indigo-200 text-sm font-medium mb-1">{member.usn}</p>
            <span className="text-indigo-300 text-sm bg-indigo-600/30 px-3 py-1 rounded-full">{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}