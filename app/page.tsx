"use client";

import { useState, useEffect, useRef } from "react";
import { useFacebookTrack } from "@/hooks/useFacebookTrack";

export default function CheckoutPage() {
  const { track } = useFacebookTrack();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // We use a ref so we only trigger "InitiateCheckout" once per session, not on every keystroke
  const initiateCheckoutFired = useRef(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Example 1: Trigger an event when they just view the page
  useEffect(() => {
    track("ViewContent", {
      content_name: "Premium Subscription Landing Page",
      content_category: "Checkout",
    });
  }, [track]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // Example 2: Trigger "InitiateCheckout" as soon as they start typing something
    if (!initiateCheckoutFired.current) {
      track(
        "InitiateCheckout",
        { value: 99.99, currency: "USD", content_name: "Premium Subscription" }
      );
      initiateCheckoutFired.current = true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated API call for payment validation...
    await new Promise((res) => setTimeout(res, 1500));

    // Example 3: Fire Facebook CAPI "Purchase" event when they process it! 
    track(
      "Purchase",
      { value: 99.99, currency: "USD", content_name: "Premium Subscription" },
      { 
        email: formData.email, 
        phone: formData.phone 
      }
    );

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-indigo-950">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Order Complete!</h2>
          <p className="text-indigo-200 mb-8">Thank you for your purchase. We have received your order.</p>
          <button 
            onClick={() => { setSuccess(false); setFormData({firstName:"", lastName:"", email:"", phone:"", address:""}); initiateCheckoutFired.current = false; }} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition duration-200"
          >
            Buy Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]">
      {/* Dynamic Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left side info */}
        <div className="flex flex-col justify-center mb-8 md:mb-0 gap-6">
          <div className="inline-flex max-w-max items-center gap-2 px-3 py-1 scale-90 sm:scale-100 rounded-full bg-white/10 border border-white/20 text-indigo-300 text-sm font-semibold mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Server-Side Tracking Active
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300 leading-tight">
            Level up your <br /> Analytics.
          </h1>
          <p className="text-lg text-indigo-200/80 max-w-md">
            Purchase the Premium Subscription to instantly see the Facebook Conversions API and Pixel synchronize events with UUID deduplication.
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex-1 backdrop-blur-sm">
              <p className="text-white/50 text-sm mb-1">Total</p>
              <p className="text-3xl font-light text-white">$99.99</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex-1 backdrop-blur-sm">
              <p className="text-white/50 text-sm mb-1">Plan</p>
              <p className="text-3xl font-light text-white">Lifetime</p>
            </div>
          </div>
        </div>

        {/* Right side form */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <h2 className="text-2xl font-semibold mb-6 text-white">Checkout details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">First Name</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Last Name</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address <span className="text-indigo-400 text-xs ml-2">(Hashed via CAPI)</span></label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="john@example.com" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Phone Number <span className="text-indigo-400 text-xs ml-2">(Hashed via CAPI)</span></label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="+1234567890" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative group overflow-hidden bg-indigo-600 rounded-xl px-4 py-4 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all opacity-100 group-hover:opacity-80"></div>
              <span className="relative flex items-center justify-center gap-2 text-white font-semibold text-lg">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Event...
                  </>
                ) : (
                  "Pay $99.99"
                )}
              </span>
            </button>
            <p className="text-xs text-center text-slate-500 mt-4">We'll strictly securely hash your details manually with SHA-256 for Facebook Match Quality.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
