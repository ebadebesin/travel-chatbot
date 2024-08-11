'use client'

import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import React from 'react'
import Image from 'next/image'

import TravelIcon from '../public/icon.png'  

import firebase from '@/firebase';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { getAuth, signOut } from "firebase/auth";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Globetrotter Travel support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false);
    const auth = getAuth();

    

  async function logout() {
    try {
        await firebase.auth().signOut();
        console.log('User signed out successfully.');
        return { success: true };
    } catch (error) {
        console.error('Error during logout:', error);
        return { error: 'Something went wrong.' };
    }
}


  const sendMessage = async () => {
    if (!message.trim() || isLoading) return; 
    setIsLoading(true)
  
    const userMessage = message;
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: userMessage }]),
      })
  
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleButtonClick = async () => {
    if (!isSignedIn) {
        // Redirect to sign-in page
        window.location.href = '/SignIn';
    } else {
        // Ask for confirmation before logging out
        const confirm = window.confirm('Are you sure you want to logout?');
        if (!confirm) {
            return;
        }
        // Log out the user
        await signOut(auth);
        window.location.href = '/SignIn'; // Redirect after sign-out
    }
  }

  useEffect(() => {
    // Check if the user is signed in
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setIsSignedIn(!!user); // If user is not null, then user is signed in
    });

    // Cleanup the subscription on unmount
    return () => unsubscribe();
  }, [auth]);


  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f5f5f5"
    >
      {/* <Button color="primary" onClick={
                    async () => {
                        const confirm = window.confirm('Are you sure you want to logout?');
                        if (!confirm) {
                            return;
                        }
                        const response = await logout();
                        if (response.success) {
                            window.location.href = '/SignIn';
                        }
                    }
                }>Logout</Button> */}

          <Button color="primary" onClick={handleButtonClick}
            sx={{
              padding: '12px 24px', // Adjust padding as desired
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Adds shadow for elevation
              borderRadius: '8px', // Optional: for rounded corners
              backgroundColor: 'lightblue', // Changes button color to blue
              color: 'white', // Text color (white against blue background)
              position: 'relative', // Use relative positioning
              top: '-0.2in', // Moves the button up by 1 inch
              '&:hover': {
                backgroundColor: 'darkblue', // Darker blue on hover
              },
            }}>
            {isSignedIn ? 'Logout' : 'Sign In'}
          </Button>

      <Stack
        direction={'column'}
        width="100%"
        maxWidth="600px"
        height="80vh"
        borderRadius={8}
        boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
        bgcolor="white"
        p={2}
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Image src={TravelIcon} alt="Travel Icon" width={40} height={40} />
          <Typography
            variant="h5"
            component="h1"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#333' }}
          >
            Travel Support Chatbot
          </Typography>
        </Stack>
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          p={1}
          border="1px solid #ddd"
          borderRadius={4}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
              mb={1}
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#e0f7fa'
                    : '#c5cae9'
                }
                color="black"
                borderRadius={16}
                p={2}
                maxWidth="80%"
                wordBreak="break-word"
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2} alignItems="center">
          <TextField
            label="Type your message"
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress} 
            disabled={isLoading}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={isLoading}
            size="large"
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
