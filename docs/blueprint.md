# **App Name**: MeshControl

## Core Features:

- Data Reception: Receive live or simulated Mesh data via WebSocket or SerialPort. Decodes compact 105-bit packets containing unit type, ID, status, position, speed, heading, battery level, and timestamp.
- Real-Time Visualization: Display active units on an interactive Leaflet map with status and location indicators.
- Dark/Light Mode: Provide a toggle for dark and light modes, using CSS variables for easy customization.
- Simulation Mode: Simulate mesh nodes moving and changing status in real-time when no actual Mesh nodes are connected, mirroring real data format.
- Remote Configuration: Remotely configure connected trackers, update status, set the position, adjust send interval, activate/deactivate units, send test messages and prepare simulated firmware updates. Control panels sit alongside unit entries.
- Admin Controls: The 'configuration central' UI allows administrators to remotely monitor and control the mesh network. This involves displaying individual devices on a visual overview, filtering them based on certain states, updating parameters, and pushing new configurations over the air.
- Node monitoring: Utilize tool powered by generative AI to identify unusual data transmission or behaviors, helping users locate and identify defective or malfunctioning MESH nodes.  

## Style Guidelines:

- Primary color: Strong blue (#2962FF), evoking the precision and reliability of digital infrastructure. The brightness and saturation help it pop against a dark background.
- Background color: Dark, desaturated blue (#161A39), creating a high-tech feel suitable for monitoring applications.
- Accent color: A bright purple (#C58BF7) creates contrast, drawing attention to interactive elements.
- Body and headline font: 'Inter', a sans-serif typeface, chosen for its modern, neutral, and objective appearance, well-suited for data-rich interfaces and comfortable readability.
- Responsive Flexbox/Grid layout ensures seamless adaptability across diverse devices, guaranteeing accessibility and optimal viewing on both desktop and mobile platforms.
- Consistent use of flat, minimalist icons throughout the interface to visually represent unit types, status indicators, and configuration options.
- Subtle transitions and animations provide feedback and enhance user experience (e.g., status updates, data reception).