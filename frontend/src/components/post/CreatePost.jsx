import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createPost, validatePostText } from '../../api/api';
import { Toaster, toast } from 'react-hot-toast';

const CreatePost = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestionUI, setShowSuggestionUI] = useState(false);
  const [suggestedText, setSuggestedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.", { style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' } });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        toast.error("Image size cannot exceed 1.5MB.", { style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' } });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !selectedImage) return;

    // AI Toxicity Validation Flow (only for text)
    if (postContent.trim() && !showSuggestionUI) {
      setIsValidating(true);
      try {
        const result = await validatePostText(postContent);
        if (!result.safe) {
          setOriginalText(postContent);
          setPostContent(result.moderatedText);
          setSuggestedText(result.moderatedText);
          setShowSuggestionUI(true);
          setIsValidating(false);
          return; // Stop flow and let user review the suggestion
        }
      } catch (error) {
        console.error("Error validating text:", error);
        // If validation fails, proceed to normal post creation so we don't block users if AI is down
      }
      setIsValidating(false);
    } else if (showSuggestionUI) {
      // User clicked "Accept & Publish"
      // Re-validate to ensure they didn't add toxic text back
      setIsValidating(true);
      try {
        const result = await validatePostText(postContent);
        if (!result.safe) {
          setPostContent(result.moderatedText);
          setSuggestedText(result.moderatedText);
          setIsValidating(false);
          return; // Show new suggestion
        }
      } catch (error) {
        console.error("Error re-validating text:", error);
      }
      setIsValidating(false);
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      
      // If we showed the suggestion UI and they are publishing, it means they clicked "Accept & Publish". 
      // We pass the original text so we can log it.
      if (showSuggestionUI) {
          formData.append('originalToxicContent', originalText);
      }
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await createPost(formData);
      
      if (selectedImage) {
        toast.success("Image is safe and your post is live!", { style: { borderRadius: '10px', background: '#dcfce7', color: '#166534', fontWeight: 'bold' } });
      } else {
        toast.success("Post created successfully!", { style: { borderRadius: '10px', background: '#334155', color: '#f8fafc', fontWeight: 'bold' } });
      }
      
      navigate('/feed');
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMsg = error.response?.data?.message || "Failed to create post. Please try again.";
      toast.error(errorMsg, { style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden relative">

        {/* Close Button (Absolute) */}
        <button
          onClick={() => navigate('/feed')}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-700 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="p-6 md:p-8">

          {/* Header Area */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="User" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-lg">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create Post</h2>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <span>Visible to</span>
                <span className="font-semibold text-slate-300">Everyone</span>
              </div>
            </div>
          </div>

          {/* Validation Suggestion Banner */}
          {showSuggestionUI && (
            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl relative">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <div>
                  <h3 className="text-sm font-semibold text-orange-400 mb-1">Content Warning</h3>
                  <p className="text-sm text-slate-300 mb-2">
                    Your post contains language that violates our community guidelines. We've suggested a safer version below. You can edit it or publish as is.
                  </p>
                  <button 
                    onClick={() => {
                        setPostContent(originalText);
                        setShowSuggestionUI(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline"
                  >
                    Cancel and revert my text
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="mb-6">
            <textarea
              className="w-full min-h-[150px] text-lg text-slate-100 placeholder-slate-500 border-none outline-none focus:outline-none focus:ring-0 active:outline-none resize-none bg-transparent p-0 leading-relaxed"
              placeholder="What's happening?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              autoFocus
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mb-6 group rounded-xl overflow-hidden border border-slate-700">
              <img src={imagePreview} alt="Preview" className="w-full max-h-[400px] object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700">

            {/* Media Actions */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="p-2.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                title="Add Photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </button>
              {/* Future: Add more icons like Emoji, Location etc. here */}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isValidating || (!postContent.trim() && !selectedImage)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-2
                    ${isSubmitting || isValidating || (!postContent.trim() && !selectedImage)
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-white text-slate-900 hover:bg-slate-200 hover:shadow-md'
                }`}
            >
              <span>{isValidating ? 'Validating...' : isSubmitting ? 'Publishing...' : showSuggestionUI ? 'Accept & Publish' : 'Post'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreatePost;