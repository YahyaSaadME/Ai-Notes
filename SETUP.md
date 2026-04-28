# AI Notes

A Next.js application with MongoDB for role-based notes, collaboration, and AI-assisted note generation.

## Features

- Sidebar navigation (collapsible with Lucide icons)
- Projects management with file uploads and descriptions
- Dedicated project details page with file gallery
- Recursive comments system with file pinning
- Individual file descriptions
- Support for multiple file formats (images, videos, audio, PDFs, documents)
- Embedded file viewing (images, videos, audio, PDFs)
- File download functionality
- Maps and surveys management with interactive Leaflet maps
- Project deletion with file cleanup
- Mongoose schema validation with relationships
- MongoDB integration
- Fully white themed UI

## Setup Instructions

### 1. Install Dependencies

```bash
npm install mongoose lucide-react
# or
yarn add mongoose lucide-react
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. The app will connect to `mongodb://localhost:27017/caddb`

**Option B: MongoDB Atlas (Cloud)**
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `.env.local` with your connection string

### 3. Environment Variables

The `.env.local` file is already configured with:
```
MONGODB_URI=mongodb://localhost:27017/caddb
```

For MongoDB Atlas, replace with your connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/caddb?retryWrites=true&w=majority
```

### 4. Run the Application

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Docker / Render Deployment

This repo includes a Dockerfile and `render.yaml`.

Local Docker run:

```bash
docker build -t ai-notes .
docker run --rm -p 3000:3000 --env-file .env.local ai-notes
```

On Render, create a Web Service from this repository and configure:

- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_ADMIN_PASS`
- `GROQ_API_KEY` if you use the AI features

The service expects a persistent disk mounted at `/var/data/uploads`, and uploaded files are read from `UPLOADS_DIR`.

## File Structure

- `/src/app/page.tsx` - Homepage with sidebar
- `/src/app/projects/page.tsx` - Projects management page
- `/src/app/components/` - Reusable components
- `/src/app/api/projects/route.ts` - Projects API endpoints
- `/src/app/api/projects/[id]/route.ts` - Individual project operations
- `/src/app/api/files/[filename]/route.ts` - File serving endpoint
- `/src/lib/mongodb.ts` - Mongoose connection utility
- `/src/models/Project.ts` - Mongoose Project schema
- `/public/uploads/` - Uploaded files storage (created automatically)

## Usage

1. Navigate to the Projects page using the sidebar
2. Click "Add New Project" to create a new project
3. Enter a project title, description (optional), and select files to upload
4. View your projects in the grid layout
5. Click "View Details" on any project to navigate to the detailed page
6. In the project details page:
   - View and navigate through files using arrow buttons or thumbnails
   - Add descriptions to individual files by clicking on the description area
   - View images, videos, audio, and PDFs directly in the browser
   - Download any file using the download button
   - Use the comments system on the right side to discuss the project
   - Pin specific files to comments for reference
   - Reply to comments to create threaded discussions
7. Use the collapsible sidebar to navigate between sections
8. Access the Maps section for geographic project management with interactive maps

## Supported File Formats

- **Images**: PNG, JPG, JPEG, GIF, WebP, SVG (embedded viewing with fullscreen)
- **Videos**: MP4, WebM, OGG, AVI, MOV (embedded video player)
- **Audio**: MP3, WAV, OGG, AAC, M4A (embedded audio player)
- **Documents**: PDF (embedded PDF viewer), DOC, DOCX, XLS, XLSX, PPT, PPTX (download)

## Project Details Features

- **Gallery View**: Amazon-style file navigation with main viewer and thumbnails
- **File Navigation**: Arrow buttons to navigate between files
- **Embedded Viewing**: Direct viewing of images, videos, audio, and PDFs
- **Fullscreen Mode**: Click on images to view in fullscreen
- **Download**: Download any file directly from the viewer
- **File Counter**: Shows current file position (e.g., "3 / 8")
- **File Type Icons**: Visual indicators for different file types

## API Endpoints

### Projects
- `GET /api/projects` - Fetch all projects
- `POST /api/projects` - Create new project with files
- `GET /api/projects/[id]` - Fetch single project
- `DELETE /api/projects/[id]` - Delete project and associated files

### Comments
- `GET /api/projects/[projectId]/comments` - Fetch project comments (recursive)
- `POST /api/projects/[projectId]/comments` - Create new comment or reply

### File Descriptions
- `GET /api/projects/[projectId]/files` - Fetch file descriptions
- `POST /api/projects/[projectId]/files` - Update file description

### Files
- `GET /api/files/[filename]` - Serve uploaded files

## New Features Added

### 📄 **Dedicated Project Details Page**
- Full-page view instead of modal
- Better navigation and file management
- Individual file descriptions
- Breadcrumb navigation back to projects

### 💬 **Recursive Comments System**
- Threaded comments with replies
- File pinning to comments
- Real-time comment updates
- User avatars and timestamps
- Comment actions (reply, pin file)

### 🔗 **Database Relationships**
- Comments linked to projects
- File descriptions with project association
- Recursive comment structure in MongoDB
- Optimized queries with proper indexing

## Database Schema

### Project Model
- `title`: String (required, max 100 characters)
- `description`: String (optional, max 1000 characters)
- `files`: Array of file names
- `createdAt`: Date (auto-generated)

### Comment Model  
- `text`: String (required, max 1000 characters)
- `author`: String (required)
- `projectId`: String (required, references Project)
- `pinnedFile`: String (optional, filename reference)
- `parentId`: String (optional, for recursive replies)
- `createdAt`: Date (auto-generated)

### FileDescription Model
- `projectId`: String (required, references Project)
- `filename`: String (required)
- `description`: String (required, max 500 characters)
- `updatedAt`: Date (auto-generated)

## UI Components

- **DashboardLayout**: Main layout with collapsible sidebar
- **Sidebar**: Navigation with Lucide React icons
- **ProjectDetails**: Modal component for detailed project view with file gallery
- **File Viewer**: Supports multiple file types with embedded viewing
- **Responsive Design**: Works on desktop, tablet, and mobile devices
