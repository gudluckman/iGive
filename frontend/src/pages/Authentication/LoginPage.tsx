import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { auth } from "../../util/firebase_util";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { NavigateFunction, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AnimatedBackground from "../../components/Animation/AnimatedBackground";
import TypewriterEffect from "../../components/Animation/TypewriterEffect";
import PageTransition from "../../components/Animation/PageTransition";
import { useTransition } from "../../context/TransitionContext";

function processSignIn(
  email: string,
  password: string,
  keepSignedIn: boolean,
  setShowAuthErrorMsg: React.Dispatch<React.SetStateAction<string>>,
  setAuthErrorMsg: React.Dispatch<React.SetStateAction<string>>,
  navigator: NavigateFunction
) {
  // Sesssion persists forever, even when the browser is quit and reopened.
  let sessionSetting = browserLocalPersistence;
  if (!keepSignedIn) {
    // Session ends when the tab is closed.
    sessionSetting = browserSessionPersistence;
  }

  setPersistence(auth, sessionSetting)
    .then(() => {
      return signInWithEmailAndPassword(auth, email, password);
    })
    .then(() => {
      navigator("/dashboard");
    })
    .catch((error) => {
      setShowAuthErrorMsg("flex");
      setAuthErrorMsg(error.message);
    });
}

function goToRegister(navigator: NavigateFunction) {
  navigator("/register");
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Show a loading screen while we wait for the auth status to come back from Firebase
  const [loading, setLoading] = useState(true);

  const [authErrorMsg, setAuthErrorMsg] = useState("unknown error.");
  const [showAuthErrorMsg, setShowAuthErrorMsg] = useState("none");
  const { showTransition, setShowTransition, setIsAuthTransition } = useTransition();

  // Check if the user is already signed in after the component renders
  useEffect(() => {
    setShowTransition(true);
    setIsAuthTransition(true);
    onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard");
      } else {
        setLoading(false);
        setShowTransition(false);
        setIsAuthTransition(false);
      }
    });
  }, [navigate, setShowTransition, setIsAuthTransition]);

  const handleSignIn = () => {
    setShowTransition(true);
    setIsAuthTransition(true);
    processSignIn(
      email,
      password,
      keepSignedIn,
      setShowAuthErrorMsg,
      setAuthErrorMsg,
      navigate
    );
  };

  if (showTransition) {
    return <PageTransition />;
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

      {/* This is shown when the app boots while it waits for Firebase to validate the session */}
      {loading && !showTransition && (
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
            Checking your session status...
          </Typography>
        </Box>
      )}

      {/* Show when loading finished */}
      {!loading && !showTransition && (
        <Container
          maxWidth="xs"
          sx={{
            backgroundColor: "rgba(218, 229, 249, 0.9)",
            borderRadius: "10px",
            padding: "40px",
            boxShadow: 3,
            fontFamily: "Inter, sans-serif",
            position: "relative",
            zIndex: 1,
            "@media (max-width: 600px)": {
              padding: "20px",
            },
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSignIn();
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <TextField
                id="email"
                label="Email"
                variant="standard"
                type="email"
                onChange={(event) => setEmail(event.target.value)}
                sx={{
                  width: "100%",
                  marginBottom: "10px",
                  "@media (max-width: 600px)": {
                    marginBottom: "8px",
                  },
                }}
              />
              <TextField
                id="password"
                label="Password"
                variant="standard"
                type={showPassword ? "text" : "password"}
                onChange={(event) => setPassword(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ width: "100%", marginBottom: "10px" }}
              />

              {/* Keep signed in checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={keepSignedIn}
                    onChange={(event) => setKeepSignedIn(event.target.checked)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault(); // Prevent form submission
                        setKeepSignedIn(!keepSignedIn);
                      }
                    }}
                    color="primary"
                  />
                }
                label="Keep me signed in"
              />

              {/* Sign in button */}
              <Button
                type="submit"
                variant="contained"
                onClick={handleSignIn}
                sx={{
                  mt: 2,
                  mb: 2,
                  p: 1.5,
                  borderRadius: "50px",
                  width: "100%",
                  backgroundColor: "#2c3c5f",
                  color: "#fff",
                  transition: "transform 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    backgroundColor: "#788bb3",
                  },
                }}
              >
                Sign In
              </Button>
            </form>

            {/* Authentication error messages */}
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  size="small"
                  onClick={() => setShowAuthErrorMsg("none")}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ display: showAuthErrorMsg, width: "100%" }}
            >
              <AlertTitle>Authentication Error</AlertTitle>
              {authErrorMsg}
            </Alert>

            {/* Link to go to register page */}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Don't have an account?{" "}
              <Link
                role="button"
                tabIndex={0}
                onClick={() => goToRegister(navigate)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    goToRegister(navigate);
                  }
                }}
                sx={{ cursor: "pointer" }}
              >
                SIGN UP
              </Link>
            </Typography>
          </Box>

          <Box mt={5}>
            <TypewriterEffect text="developing for CSE without getting paid since 2024" />
          </Box>
        </Container>
      )}
    </Box>
  );
}