"use client";
import React from 'react'
import Link from 'next/link'
import { Brain, Users, Shield, Sparkles, ArrowRight, BookOpen } from 'lucide-react'
import DashboardLayout from './components/DashboardLayout'

export default function page() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Animated Header Section */}
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <Brain className="w-12 h-12 text-blue-600 animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to AI Notes Management System
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Select a section from the sidebar to get started.
          </p>
        </div>
        
        {/* Authentication Links with Enhanced Animations */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up animation-delay-200">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-blue-600 animate-pulse" />
            <h3 className="text-xl font-semibold text-blue-800">Authentication</h3>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="group bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <Users className="w-5 h-5 group-hover:animate-bounce" />
              User Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link 
              href="/admin/login" 
              className="group bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <Shield className="w-5 h-5 group-hover:animate-pulse" />
              Admin Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>

        {/* Feature Cards with Staggered Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up animation-delay-400">
          <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-6 h-6 text-blue-500 animate-pulse" />
              <h4 className="font-semibold text-gray-800">AI-Powered</h4>
            </div>
            <p className="text-gray-600 text-sm">Smart note organization with AI assistance</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-green-500 animation-delay-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-green-500 animate-pulse" />
              <h4 className="font-semibold text-gray-800">Easy Management</h4>
            </div>
            <p className="text-gray-600 text-sm">Effortless note creation and organization</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500 animation-delay-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-purple-500 animate-pulse" />
              <h4 className="font-semibold text-gray-800">Secure</h4>
            </div>
            <p className="text-gray-600 text-sm">Protected with advanced security features</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </DashboardLayout>
  )
}
