import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import '../src/global-css/navbar.css'
/**
 * Interface to avoid using `any` for server responses.
 * Adjust fields as needed for your backend response shape.
 */
interface ApiResponse {
    message?: string;
    token?: string;
    username?: string;
}

/**
 * A helper function to decode a JWT using `atob`
 * instead of `Buffer.from` for browser compatibility.
 */
function parseJwt(token: string) {
    try {
        const base64Payload = token.split('.')[1];
        // Use `atob` instead of `Buffer` in the browser
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch (e) {
        console.error('Failed to parse token', e);
        return null;
    }
}

function App() {
    const navigate = useNavigate();

    // ===== MODAL STATES =====
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // ===== LOGGED-IN USER =====
    const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

    // ===== SIGN-UP FORM FIELDS =====
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [rememberMe, setRememberMe] = useState(false);

    // Password strength checks
    const [hasMinLength, setHasMinLength] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);

    // ===== LOGIN FORM FIELDS (username + password) =====
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // On mount, check if a token is stored in localStorage
    useEffect(() => {
        const token = localStorage.getItem('myAppToken');
        if (token) {
            const decoded = parseJwt(token);
            if (decoded && decoded.username) {
                setLoggedInUser(decoded.username);
            }
        }
    }, []);

    // ====== MODAL HANDLERS ======
    const handleOpenSignUp = () => {
        setIsSignUpOpen(true);
        setIsLoginOpen(false);
    };

    const handleCloseSignUp = () => {
        // Clear sign-up fields
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRememberMe(false);

        // Reset errors
        setEmailError('');
        setUsernameError('');
        setPasswordError('');
        setConfirmPasswordError('');
        // Reset password checks
        setHasMinLength(false);
        setHasUppercase(false);
        setHasNumber(false);
        setHasSpecialChar(false);

        setIsSignUpOpen(false);
    };

    const handleOpenLogin = () => {
        setIsLoginOpen(true);
        setIsSignUpOpen(false);
    };

    const handleCloseLogin = () => {
        setLoginUsername('');
        setLoginPassword('');
        setIsLoginOpen(false);
    };

    // ===== VALIDATIONS =====
    const validateEmail = (value: string) => {
        setEmail(value);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError('Invalid email format');
        } else {
            setEmailError('');
        }
    };

    // Updated username validation: only alphanumeric + underscore + dot
    const validateUsername = (value: string) => {
        const usernameRegex = /^[A-Za-z0-9._]+$/;
        if (!usernameRegex.test(value)) {
            setUsernameError(
                'Username can only contain letters, digits, underscores, and periods.',
            );
        } else if (value.trim().length < 3) {
            setUsernameError('Username must be at least 3 characters long.');
        } else {
            setUsernameError('');
        }
        setUsername(value);
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setHasMinLength(value.length >= 8);
        setHasUppercase(/[A-Z]/.test(value));
        setHasNumber(/[0-9]/.test(value));
        setHasSpecialChar(/[^A-Za-z0-9]/.test(value));

        if (
            value.length > 0 &&
            (value.length < 8 ||
                !/[A-Z]/.test(value) ||
                !/[0-9]/.test(value) ||
                !/[^A-Za-z0-9]/.test(value))
        ) {
            setPasswordError('Password is not strong enough');
        } else {
            setPasswordError('');
        }
    };

    const handleConfirmPassword = (value: string) => {
        setConfirmPassword(value);
        if (value && value !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    // ====== SIGN-UP SUBMISSION ======
    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic client-side checks
        if (emailError || usernameError || passwordError || confirmPasswordError) {
            alert('Please fix the errors before submitting.');
            return;
        }

        if (!username) {
            setUsernameError('Username is required');
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            return;
        }

        if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
            alert('Please meet all password criteria.');
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/auth/signup`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, username, password, rememberMe }),
                },
            );

            /** Provide a typed object instead of `any` */
            let data: ApiResponse = {};
            try {
                data = await response.json();
            } catch (err) {
                console.error('Error parsing JSON:', err);
            }

            if (response.ok) {
                alert('Sign-up successful!');
                navigate('/tutorial'); // navigate after success
                handleCloseSignUp();
            } else {
                const msg = data.message || 'Unknown error';
                alert(`Sign-up failed: ${msg}`);
            }
        } catch (error) {
            console.error('Sign-up error:', error);
            alert('Server error. Please try again.');
        }
    };

    // ====== LOGIN SUBMISSION (USERNAME + PASSWORD) ======
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: loginUsername, password: loginPassword }),
                },
            );

            let data: ApiResponse = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.error('Error reading JSON from login response:', jsonErr);
            }

            if (response.ok) {
                // e.g. { token: "jwt-token-here", username: "bob" }
                const { token, username } = data;
                if (!token || !username) {
                    alert('Login failed: no token or username returned by server.');
                    return;
                }

                localStorage.setItem('myAppToken', token);
                setLoggedInUser(username);
                alert('Logged in successfully!');
                handleCloseLogin();
            } else {
                // We got a non-2xx response
                const msg = data.message || 'Unknown error';
                alert(`Login failed: ${msg}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Server error. Please try again.');
        }
    };

    // ====== LOG OUT ======
    const handleLogout = () => {
        localStorage.removeItem('myAppToken');
        setLoggedInUser(null);
    };

    return (
        <div className="landing-page">
            {/* Header / Navigation */}
            <header className="navbar">
                <div className="nav-left">
                    <h1 className="brand">echo</h1>
                </div>
                <div className="nav-right">
                    {loggedInUser ? (
                        <>
                            <span className="nav-username">Hello, {loggedInUser}!</span>
                            <button className="nav-btn" onClick={handleLogout}>
                                Log Out
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="nav-btn" onClick={handleOpenLogin}>
                                Log In
                            </button>
                            <button className="nav-btn signup-btn" onClick={handleOpenSignUp}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h2 className="hero-title">
                        Ever <span className="text-red">suffered</span> with{' '}
                        <span className="text-teal">code documentation?</span>
                    </h2>
                    <p className="hero-subtitle">
                        Give it another <span className="text-green">chance</span> with{' '}
                        <span className="text-teal">echo</span>
                    </p>
                    <button className="cta-btn">Try now</button>
                </div>
            </section>

            {/* Info / Feature Section */}
            <section className="info-section">
                <div className="code-tree-container">
          <pre className="code-tree">
{`Project
├── fe
│   └── src
├── be
│   └── app
│       └── Pages
│          └──App.tsx
│       └──CSS
│          ├──Navbar.css
│          ├──searchbar.css
│          └──ColorPalette.css
├── DB
│   └── init.sql
└── docker-compose.yml
`}
          </pre>
                </div>
                <div className="info-text">
                    <h3>
                        Create manuals that use <span className="text-teal">code sectioning</span>. Documenting only the idea of
                        selected parts<span className="asterisk">*</span>
                    </h3>
                    <p className="note">
                        <span className="asterisk">*</span> Code documentation and{' '}
                        <span className="api-color">API</span> get their own special treatment
                    </p>
                </div>
            </section>

            {/* SIGN-UP MODAL */}
            {isSignUpOpen && (
                <div className="modal-overlay" onClick={handleCloseSignUp}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={handleCloseSignUp}>
                            ×
                        </button>

                        <div className="thank-you-section">
                            <p className="thank-you-text">Thank You for Thinking of Us &lt;3</p>
                        </div>

                        <form onSubmit={handleSignUpSubmit} className="signup-form">
                            {/* Username Field */}
                            <label htmlFor="username" className="signup-label">
                                Username <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Your username"
                                value={username}
                                required
                                onBlur={(e) => validateUsername(e.target.value)}
                                onChange={(e) => validateUsername(e.target.value)}
                                className="signup-input"
                            />
                            {usernameError && <p className="error-text">{usernameError}</p>}

                            {/* Email Field */}
                            <label htmlFor="email" className="signup-label">
                                Email <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="example@example.com"
                                value={email}
                                required
                                onBlur={(e) => validateEmail(e.target.value)}
                                onChange={(e) => validateEmail(e.target.value)}
                                className="signup-input"
                            />
                            {emailError && <p className="error-text">{emailError}</p>}

                            {/* Password Field */}
                            <label htmlFor="password" className="signup-label">
                                Password <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                required
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                className="signup-input"
                            />
                            {passwordError && <p className="error-text">{passwordError}</p>}

                            {/* Confirm Password */}
                            <label htmlFor="confirmPassword" className="signup-label">
                                Confirm Password <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                required
                                onBlur={(e) => handleConfirmPassword(e.target.value)}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="signup-input"
                            />
                            {confirmPasswordError && <p className="error-text">{confirmPasswordError}</p>}

                            {/* Remember password checkbox */}
                            <div className="remember-me-container">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="remember-me-checkbox"
                                />
                                <label htmlFor="rememberMe" className="remember-me-label">
                                    Remember password
                                </label>
                            </div>

                            {/* Password Criteria */}
                            <div className="password-criteria">
                                <p className="criteria-title">Password Criteria:</p>
                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasMinLength}
                                        className="criteria-checkbox"
                                        id="minLengthCheck"
                                    />
                                    <label htmlFor="minLengthCheck" className="criteria-label">
                                        At least 8 characters
                                    </label>
                                </div>

                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasUppercase}
                                        className="criteria-checkbox"
                                        id="uppercaseCheck"
                                    />
                                    <label htmlFor="uppercaseCheck" className="criteria-label">
                                        At least 1 uppercase letter
                                    </label>
                                </div>

                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasNumber}
                                        className="criteria-checkbox"
                                        id="numberCheck"
                                    />
                                    <label htmlFor="numberCheck" className="criteria-label">
                                        At least 1 number
                                    </label>
                                </div>

                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasSpecialChar}
                                        className="criteria-checkbox"
                                        id="specialCheck"
                                    />
                                    <label htmlFor="specialCheck" className="criteria-label">
                                        At least 1 special character
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="cta-btn submit-btn">
                                Start Documenting
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* LOGIN MODAL (USERNAME + PASSWORD) */}
            {isLoginOpen && (
                <div className="modal-overlay" onClick={handleCloseLogin}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={handleCloseLogin}>
                            ×
                        </button>

                        <div className="thank-you-section">
                            <p className="thank-you-text">Welcome Back!</p>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="login-form">
                            {/* Username Field */}
                            <label htmlFor="loginUsername" className="login-label">
                                Username <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="loginUsername"
                                type="text"
                                placeholder="Your username"
                                value={loginUsername}
                                required
                                onChange={(e) => setLoginUsername(e.target.value)}
                                className="login-input"
                            />

                            {/* Password Field */}
                            <label htmlFor="loginPassword" className="login-label">
                                Password <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="loginPassword"
                                type="password"
                                placeholder="Your password"
                                value={loginPassword}
                                required
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="login-input"
                            />

                            <button type="submit" className="cta-btn submit-btn">
                                Log In
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
