import React from 'react';

export default function AccountPage() {
  // Mock user data
  const user = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    joined: '2023-01-15',
    bio: 'Productivity enthusiast. Loves planning and organizing tasks!',
    avatar: '/placeholder-user.jpg',
    location: 'New York, USA',
    website: 'janedoe.com',
    socials: [
      { name: 'Twitter', url: '#', icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.762.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.868 9.868 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"/></svg>
      ) },
      { name: 'Website', url: '#', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
      ) },
    ]
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181A] to-[#232325] py-12 px-4">
      <div className="w-full max-w-md bg-[#1e1e20] rounded-2xl shadow-xl border border-gray-800 p-8 relative">
        <span className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-semibold px-3 py-1 rounded-full shadow-sm opacity-80 z-10">Under Development</span>
        <div className="flex flex-col items-center mb-6">
          <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-blue-500 shadow mb-3 bg-[#232325] object-cover" />
          <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
          <p className="text-blue-400 text-sm mb-2">@janedoe</p>
          <p className="text-gray-300 text-center mb-2">{user.bio}</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Peer Info</h3>
          <div className="flex flex-col gap-2 text-gray-400">
            <div><span className="font-medium text-gray-300">Location:</span> {user.location}</div>
            <div><span className="font-medium text-gray-300">Joined:</span> {user.joined}</div>
            <div><span className="font-medium text-gray-300">Email:</span> {user.email}</div>
          </div>
        </div>
        <div className="flex gap-4 justify-center mt-4">
          {user.socials.map((social, idx) => (
            <a key={idx} href={social.url} className="text-gray-400 hover:text-blue-400 transition" target="_blank" rel="noopener noreferrer" title={social.name}>
              {social.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 