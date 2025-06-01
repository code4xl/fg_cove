// import React, { useState } from 'react';
// import { Eye, EyeOff } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
// import { GoogleLogin } from '@react-oauth/google';
// import {
//   login,
//   loginWithGoogle,
//   register,
// } from '../../services/repository/userRepo';

// const Login = () => {
//   const [isLoginView, setIsLoginView] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [name, setName] = useState('');
//   const [mobile, setMobile] = useState('');
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (isLoginView) {
//       dispatch(login(email, password, navigate));
//     } else {
//       dispatch(register(name, email, password, mobile, navigate));
//     }
//   };

//   const handleSuccess = async (credentialResponse) => {
//     dispatch(loginWithGoogle(credentialResponse, navigate));
//   };

//   const handleError = () => {
//     alert('Google Sign-In failed');
//   };

//   const toggleView = () => {
//     setIsLoginView(!isLoginView);
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50">
//       <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
//         {/* Logo */}
//         <div className="flex justify-center mb-6">
//           <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
//             <svg
//               width="24"
//               height="24"
//               viewBox="0 0 24 24"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z"
//                 fill="white"
//               />
//             </svg>
//           </div>
//         </div>

//         {isLoginView ? (
//           <div>
//             <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
//               Sign In
//             </h2>

//             <form className="space-y-4" onSubmit={handleSubmit}>
//               <div>
//                 <label
//                   htmlFor="email"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   id="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                   placeholder="Enter your email"
//                   required
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="password"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     id="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                     placeholder="Enter your password"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <input
//                     id="remember-me"
//                     name="remember-me"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                   />
//                   <label
//                     htmlFor="remember-me"
//                     className="ml-2 block text-sm text-gray-700"
//                   >
//                     Remember me
//                   </label>
//                 </div>

//                 <a
//                   href="#"
//                   className="text-sm font-medium text-green-600 hover:text-green-500"
//                 >
//                   Forgot password?
//                 </a>
//               </div>

//               <button
//                 type="submit"
//                 className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
//               >
//                 Sign In
//               </button>
//             </form>

//             <div className="mt-6">
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-300"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-2 bg-white text-gray-500">
//                     Or continue with
//                   </span>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <div className="w-full">
//                   <GoogleLogin
//                     onSuccess={handleSuccess}
//                     onError={handleError}
//                     scope="email profile"
//                   />
//                 </div>
//               </div>
//             </div>

//             <p className="mt-6 text-center text-sm text-gray-600">
//               Don't have an account?{' '}
//               <button
//                 onClick={toggleView}
//                 className="font-medium text-green-600 hover:text-green-500"
//               >
//                 Sign up
//               </button>
//             </p>
//           </div>
//         ) : (
//           <div>
//             <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
//               Create Account
//             </h2>

//             <form className="space-y-4" onSubmit={handleSubmit}>
//               <div>
//                 <label
//                   htmlFor="name"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Full Name
//                 </label>
//                 <input
//                   type="text"
//                   id="name"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                   placeholder="Enter your full name"
//                   required
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="mobile"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Mobile Number
//                 </label>
//                 <input
//                   type="tel"
//                   id="mobile"
//                   value={mobile}
//                   onChange={(e) => setMobile(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                   placeholder="Enter your mobile number"
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="register-email"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   id="register-email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                   placeholder="Enter your email"
//                   required
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="register-password"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     id="register-password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//                     placeholder="Create a password"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
//               >
//                 Create Account
//               </button>
//             </form>

//             <div className="mt-6">
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-300"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-2 bg-white text-gray-500">
//                     Or sign up with
//                   </span>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <div className="w-full">
//                   <GoogleLogin
//                     onSuccess={handleSuccess}
//                     onError={handleError}
//                     scope="email profile"
//                   />
//                 </div>
//               </div>
//             </div>

//             <p className="mt-6 text-center text-sm text-gray-600">
//               Already have an account?{' '}
//               <button
//                 onClick={toggleView}
//                 className="font-medium text-green-600 hover:text-green-500"
//               >
//                 Sign in
//               </button>
//             </p>
//           </div>
//         )}

//         <p className="mt-6 text-xs text-center text-gray-500">
//           By continuing, you agree to our{' '}
//           <a href="#" className="text-green-600 hover:text-green-500">
//             Terms of Service
//           </a>{' '}
//           and{' '}
//           <a href="#" className="text-green-600 hover:text-green-500">
//             Privacy Policy
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;







import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import {
  login,
  loginWithGoogle,
  register,
} from '../../services/repository/userRepo';

const Login = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoginView) {
      dispatch(login(email, password, navigate));
    } else {
      dispatch(register(name, email, password, mobile, navigate));
    }
  };

  // const handleSuccess = async (credentialResponse) => {
  //   dispatch(loginWithGoogle(credentialResponse, navigate));
  // };

  // const handleError = () => {
  //   alert('Google Sign-In failed');
  // };

  // const toggleView = () => {
  //   setIsLoginView(!isLoginView);
  // };

  return (
    //bg-gradient-to-br from-slate-50 to-blue-50
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4"> 
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-purple-200/30 rounded-full blur-lg"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
          {/* Card decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          
          {/* Logo */}
          <div className="flex justify-center mb-8 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">Safpack</span>
            </div>
          </div>

          {isLoginView ? (
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                <p className="text-slate-600">Sign in to your account to continue</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded bg-slate-50"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-slate-700"
                    >
                      Remember me
                    </label>
                  </div>

                  <a
                    href="#"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </button>
              </form>

              {/* <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="w-full [&>div]:w-full [&>div>div]:w-full [&>div>div>div]:w-full [&>div>div>div]:justify-center [&>div>div>div]:py-3 [&>div>div>div]:rounded-xl [&>div>div>div]:border-slate-200 [&>div>div>div]:bg-slate-50/50 [&>div>div>div]:hover:bg-slate-100/50 [&>div>div>div]:transition-all [&>div>div>div]:duration-200">
                    <GoogleLogin
                      onSuccess={handleSuccess}
                      onError={handleError}
                      scope="email profile"
                    />
                  </div>
                </div>
              </div> */}

              {/* <p className="mt-8 text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <button
                  onClick={toggleView}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Create account
                </button>
              </p> */}
            </div>
          ) : (
            <div className="relative z-10">
              {/* <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h2>
                <p className="text-slate-600">Join thousands of teams using SheetFlow</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="mobile"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="register-email"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="register-password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 pr-12"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Account
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">
                      Or sign up with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="w-full [&>div]:w-full [&>div>div]:w-full [&>div>div>div]:w-full [&>div>div>div]:justify-center [&>div>div>div]:py-3 [&>div>div>div]:rounded-xl [&>div>div>div]:border-slate-200 [&>div>div>div]:bg-slate-50/50 [&>div>div>div]:hover:bg-slate-100/50 [&>div>div>div]:transition-all [&>div>div>div]:duration-200">
                    <GoogleLogin
                      onSuccess={handleSuccess}
                      onError={handleError}
                      scope="email profile"
                    />
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <button
                  onClick={toggleView}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in instead
                </button>
              </p> */}
            </div>
          )}

          <p className="mt-8 text-xs text-center text-slate-500 relative z-10">
            By continuing, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Floating elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400/30 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-indigo-400/20 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default Login;