import React, { useState, useEffect } from 'react';

const TutorialModal = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Reset slide when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentSlide(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const slides = [
        {
            title: "Welcome to SentiAware! ✨",
            description: "A vibrant social network where safety meets connection. We're so glad you're here! Let's take a quick tour.",
            icon: (
                <div className="bg-[#8E54E9]/20 p-6 rounded-full inline-block mb-2 ring-4 ring-[#8E54E9]/30">
                    <svg className="w-16 h-16 text-[#8E54E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </div>
            )
        },
        {
            title: "Connect & Chat 💬",
            description: "Find friends, share your thoughts, and chat securely in real-time. Engagement matters on SentiAware.",
            icon: (
                <div className="bg-blue-500/20 p-6 rounded-full inline-block mb-2 ring-4 ring-blue-500/30">
                    <svg className="w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                </div>
            )
        },
        {
            title: "Smart AI Moderation 🤖",
            description: "Our AI scans text and images in real-time to protect our community from toxic language, violence, and NSFW content.",
            icon: (
                <div className="bg-amber-500/20 p-6 rounded-full inline-block mb-2 ring-4 ring-amber-500/30">
                    <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
            )
        },
        {
            title: "Community Driven 🚩",
            description: "See something inappropriate despite our filters? You can report posts and our system will automatically apply filters or take action, giving power back to the community.",
            icon: (
                <div className="bg-rose-500/20 p-6 rounded-full inline-block mb-2 ring-4 ring-rose-500/30">
                    <svg className="w-16 h-16 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(curr => curr - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-[#1A1A24] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#2D2D3B] flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Visual Progress Bar Top */}
                <div className="h-1.5 w-full bg-[#232330] flex">
                    {slides.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`flex-1 h-full transition-all duration-300 ${idx <= currentSlide ? 'bg-[#8E54E9]' : 'bg-transparent'}`} 
                        />
                    ))}
                </div>

                {/* Close Button Top Right */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white hover:bg-[#2A2A3A] p-1 rounded-full transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Main Content Area */}
                <div className="p-8 pb-10 flex-col flex items-center text-center mt-4">
                    <div className="min-h-[140px] flex items-center justify-center mb-6 animate-in slide-in-from-bottom-2 duration-500 key={currentSlide}">
                        {slides[currentSlide].icon}
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight animate-in fade-in duration-500 delay-100 key={currentSlide}">
                        {slides[currentSlide].title}
                    </h2>
                    
                    <p className="text-gray-400 text-[15px] sm:text-base leading-relaxed max-w-sm mx-auto animate-in fade-in duration-500 delay-200 key={currentSlide}">
                        {slides[currentSlide].description}
                    </p>
                </div>

                {/* Bottom Navigation Ribbon */}
                <div className="bg-[#232330] p-5 sm:px-8 border-t border-[#2D2D3B] flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {slides.map((_, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-[#8E54E9] w-6' : 'bg-gray-600 hover:bg-gray-400'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentSlide > 0 && (
                            <button 
                                onClick={handlePrev}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-[#8E54E9] hover:bg-[#7A42E4] rounded-xl shadow-lg shadow-[#8E54E9]/30 transition-all hover:-translate-y-0.5"
                        >
                            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
