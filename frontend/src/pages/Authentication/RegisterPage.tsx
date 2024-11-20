import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  LinearProgress,
  Grid,
  Link,
} from "@mui/material";
import { auth } from "../../util/firebase_util";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { NavigateFunction, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { Check, Visibility, VisibilityOff } from "@mui/icons-material";
import AnimatedBackground from "../../components/Animation/AnimatedBackground";
import TypewriterEffect from "../../components/Animation/TypewriterEffect";

const isValidZID = (email: string) => {
  const zIDRegex = /^z\d{7}@(ad\.)?unsw\.edu\.au$/;
  return zIDRegex.test(email);
};

const calculatePasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.match(/[a-z]+/)) strength += 25;
  if (password.match(/[A-Z]+/)) strength += 25;
  if (password.match(/[0-9]+/)) strength += 25;
  return strength;
};

const getPasswordFeedback = (password: string) => {
  const feedback = [];
  if (password.length < 8) feedback.push("Use at least 8 characters");
  if (!password.match(/[a-z]+/)) feedback.push("Include lowercase letters");
  if (!password.match(/[A-Z]+/)) feedback.push("Include uppercase letters");
  if (!password.match(/[0-9]+/)) feedback.push("Include numbers");
  return feedback;
};

const goToLogin = (navigator: NavigateFunction) => {
  navigator("/");
}

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState("unknown error.");
  const [showAuthErrorMsg, setShowAuthErrorMsg] = useState("none");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([]);
  const isValidEmail = email ? isValidZID(email) : true;
  const isValidPassword = password.length >= 8;
  const canSubmit = email && password && isValidEmail && isValidPassword;
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing registration state
    localStorage.removeItem("justRegistered");

    // Only check auth state if we're not showing success message
    if (!showSuccess) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && !showSuccess) {
          // If user is authenticated and not showing success, sign out
          signOut(auth).then(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, [showSuccess]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
    setPasswordFeedback(getPasswordFeedback(password));
  }, [password]);

  const handleSignUp = () => {
    if (!isValidZID(email)) {
      setShowAuthErrorMsg("flex");
      setAuthErrorMsg("Please use a valid zID email (z0000000@ad.unsw.edu.au)");
      return;
    }

    if (password.length < 8) {
      setShowAuthErrorMsg("flex");
      setAuthErrorMsg("Password must be at least 8 characters long");
      return;
    }

    if (!firstName || !lastName) {
      setShowAuthErrorMsg("flex");
      setAuthErrorMsg("Please enter your first and last name.");
      return;
    }

    setLoading(true); // Start loading
    localStorage.setItem("isRegistering", "true");

    // Ensure we're signed out
    signOut(auth).finally(() => {
      // Proceed with registration
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/user_register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to register user in database");
          }
          return response.json();
        })
        .then(() => {
          // Create the Firebase auth account
          return createUserWithEmailAndPassword(auth, email, password).catch(
            (error) => {
              if (error.code === "auth/email-already-in-use") {
                throw new Error("Account already exists. Please login instead.");
              }
              throw error;
            }
          );
        })
        .then((userCredential) => {
          // Sign out and store registration state
          localStorage.setItem("justRegistered", "true");
          return signOut(auth);
        })
        .then(() => {
          setLoading(false); // Stop loading before showing success
          setShowSuccess(true); // Show the success message
          localStorage.removeItem("isRegistering");
          // Redirect to login page after showing success message
          setTimeout(() => {
            navigate("/");
          }, 3000);
        })
        .catch((error) => {
          console.error("Registration error:", error);
          setShowAuthErrorMsg("flex");
          setAuthErrorMsg(
            error.message === "Account already exists. Please login instead."
              ? error.message
              : "Registration failed. Please try again."
          );
          setLoading(false); // Stop loading if there's an error
          localStorage.removeItem("isRegistering");
        });
    });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "relative",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      <AnimatedBackground />
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.8)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {localStorage.getItem("isRegistering") === "true"
              ? "Registering your account..."
              : "Checking your session status..."}
          </Typography>
        </Box>
      ) : showSuccess ? (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(218, 229, 249, 0.95)",
            zIndex: 9999,
          }}
        >
          <Container
            maxWidth="xs"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "10px",
              padding: "40px",
              boxShadow: 3,
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#2c3c5f",
                borderRadius: "50%",
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Check sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Open Sans, sans-serif",
                fontWeight: "bold",
                color: "#2c3c5f",
                mb: 2,
              }}
            >
              Success!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#626a99",
                mb: 3,
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              Your account has been created successfully. Redirecting to
              login...
            </Typography>
            <CircularProgress
              size={30}
              sx={{
                color: "#2c3c5f",
              }}
            />
          </Container>
        </Box>
      ) : (
        <Container
          maxWidth="sm"
          sx={{
            backgroundColor: "rgba(218, 229, 249, 0.9)",
            borderRadius: "10px",
            padding: { xs: "20px", sm: "40px" },
            boxShadow: 3,
            fontFamily: "Inter, sans-serif",
            position: "relative",
            zIndex: 1,
            width: { xs: "90%", sm: "70%", md: "60%" },
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Box textAlign="center" sx={{ mb: 2 }}>
            <Typography
              fontWeight="400"
              sx={{
                fontFamily: "Open Sans, sans-serif",
                fontSize: { xs: "5rem", md: "6rem" },
                mb: 1,
              }}
            >
              iGive
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
              gutterBottom
            >
              an update to CSE after 50 years
            </Typography>
          </Box>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignUp();
            }}
          >
            {/* Registration input fields */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="firstName"
                  label="First Name"
                  variant="standard"
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="lastName"
                  label="Last Name"
                  variant="standard"
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="email"
                  label="zID Email"
                  variant="standard"
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  error={!isValidZID(email) && email !== ""}
                  helperText={
                    !isValidZID(email) && email !== ""
                      ? "Invalid zID email format"
                      : ""
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="password"
                  label="Password"
                  variant="standard"
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  error={password.length > 0 && !isValidPassword}
                  helperText={
                    password.length > 0 && !isValidPassword
                      ? "Password must be at least 8 characters long"
                      : ""
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Grid>

              {/* Password strength bar */}
              <Grid item xs={12}>
                <Box sx={{ width: "100%", mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Password Strength
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 5,
                        backgroundColor:
                          passwordStrength <= 25
                            ? "#f44336"
                            : passwordStrength <= 50
                            ? "#ff9800"
                            : passwordStrength <= 75
                            ? "#ffeb3b"
                            : "#4caf50",
                      },
                    }}
                  />
                  {passwordFeedback.length > 0 && (
                    <Box sx={{ mt: 1, color: "text.secondary" }}>
                      <Typography variant="body2">
                        Suggestions to improve:
                      </Typography>
                      <ul>
                        {passwordFeedback.map((feedback, index) => (
                          <li
                            key={index}
                            style={{
                              fontSize: "0.8rem",
                              fontFamily: "sans-serif",
                            }}
                          >
                            {feedback}
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Sign up button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit}
                  onClick={handleSignUp}
                  sx={{
                    p: 1.5,
                    borderRadius: "50px",
                    width: "100%",
                    backgroundColor: "#2c3c5f",
                    color: "#fff",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": {
                      transform: canSubmit ? "translateY(-3px)" : "none",
                      backgroundColor: canSubmit ? "#788bb3" : "#2c3c5f",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(0, 0, 0, 0.12)",
                      color: "rgba(0, 0, 0, 0.26)",
                    },
                  }}
                >
                  Register
                </Button>
              </Grid>
            </Grid>
          </form>

          <Grid container spacing={2}>
            {/* Error messages */}
            <Grid item xs={12}>
              <Alert
                severity="error"
                action={
                  <IconButton
                    size="small"
                    onClick={() => setShowAuthErrorMsg("none")}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{
                  display: showAuthErrorMsg,
                  width: "100%",
                  mt: 2,
                }}
              >
                <AlertTitle>Authentication Error</AlertTitle>
                {authErrorMsg}
              </Alert>
            </Grid>

            {/* Link to go to login page */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ textAlign: "center" }}
              >
                Already have an account?{" "}
                <Link
                  role="button"
                  tabIndex={0}
                  onClick={() => goToLogin(navigate)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      goToLogin(navigate);
                    }
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  LOG IN
                </Link>
              </Typography>
            </Grid>
          </Grid>

          <Box mt={3} sx={{ display: { xs: "none", sm: "block" } }}>
            <TypewriterEffect text="developing for CSE without getting paid since 2024" />
          </Box>
        </Container>
      )}
    </Box>
  );
}
