import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { loginSuccess } from '../../redux/authSlice';

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    bio: '',
    location: '',
    address: '',
    phone: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prefill form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        nickname: user.nickname || '',
        bio: user.bio || '',
        location: user.location || '',
        address: user.address || '',
        phone: user.phone || '',
      });
      setAvatarPreview(user.profilePic || '');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePicFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append('name', formData.fullName);
      form.append('nickname', formData.nickname);
      form.append('bio', formData.bio);
      form.append('location', formData.location);
      form.append('address', formData.address);
      form.append('phone', formData.phone);
      if (profilePicFile) form.append('profilePic', profilePicFile);

      // Ensure your backend route matches
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.put(
        `${API_URL}/api/auth/update`, // backend update route
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // Update Redux with new user data
      dispatch(loginSuccess(res.data));

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Update failed:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A24] pt-12 pb-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Edit Profile</h1>
          <p className="text-gray-400">Update your personal details and profile picture.</p>
        </div>

        <div className="bg-[#232330] rounded-2xl border border-[#2D2D3B] shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">

            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <div className="h-28 w-28 rounded-full border-4 border-[#1A1A24] shadow-sm bg-[#2A2A3A] overflow-hidden ring-1 ring-[#2D2D3B]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {user.name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <label htmlFor="pfp-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </label>
                <input id="pfp-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              <p className="mt-3 text-xs text-gray-400">Click to change avatar</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2D2D3B] rounded-lg text-white focus:bg-[#1A1A24] focus:ring-2 focus:ring-[#8E54E9]/50 focus:border-[#8E54E9] transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Nickname (Optional)</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2D2D3B] rounded-lg text-white focus:bg-[#1A1A24] focus:ring-2 focus:ring-[#8E54E9]/50 focus:border-[#8E54E9] transition-all outline-none"
                  placeholder="e.g. Nenu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2D2D3B] rounded-lg text-white focus:bg-[#1A1A24] focus:ring-2 focus:ring-[#8E54E9]/50 focus:border-[#8E54E9] transition-all outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2D2D3B] rounded-lg text-white focus:bg-[#1A1A24] focus:ring-2 focus:ring-[#8E54E9]/50 focus:border-[#8E54E9] transition-all outline-none"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2D2D3B] rounded-lg text-white focus:bg-[#1A1A24] focus:ring-2 focus:ring-[#8E54E9]/50 focus:border-[#8E54E9] transition-all outline-none"
                  placeholder="Complete Address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2D2D3B] rounded-lg text-white focus:bg-[#1A1A24] focus:ring-2 focus:ring-[#8E54E9]/50 focus:border-[#8E54E9] transition-all outline-none"
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#2D2D3B] flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex-1 px-4 py-2.5 border border-[#2D2D3B] rounded-xl text-gray-400 font-semibold hover:bg-[#2A2A3A] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2.5 bg-[#8E54E9] text-white rounded-xl font-semibold hover:bg-[#7A42E4] transition-colors shadow-md shadow-[#8E54E9]/20 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
