/**
 * COURSE SEEDING SCRIPT
 * Seeds 10 comprehensive courses with detailed lessons
 * Covers: IoT, Embedded Systems, AI, Data Science, Web Dev, App Dev, Cybersecurity, Robotics, Cloud Computing, DevOps
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 10 });

// Course definitions with lessons
const courses = [
    {
        title: 'Internet of Things (IoT) Fundamentals',
        slug: 'iot-fundamentals',
        description: 'Master the complete IoT ecosystem: sensors, connectivity, cloud platforms, and real-world applications. Learn to build connected devices and smart systems.',
        category: 'Internet of Things',
        topics: ['IoT', 'Sensors', 'Arduino', 'ESP32', 'Cloud Computing'],
        lessons: [
            { title: 'Introduction to IoT', description: 'Understanding IoT basics, architecture, and real-world applications', type: 'video', duration: 15, xp: 25 },
            { title: 'IoT Hardware Components', description: 'Microcontrollers, sensors, actuators, and communication modules', type: 'ppt', duration: 20, xp: 30 },
            { title: 'Setting Up Arduino Development', description: 'Installation, IDE setup, and first program', type: 'video', duration: 25, xp: 35 },
            { title: 'Sensor Integration & Data Collection', description: 'Working with temperature, humidity, and motion sensors', type: 'pdf', duration: 20, xp: 30 },
            { title: 'WiFi & Cellular Connectivity', description: 'Connecting IoT devices to the internet using WiFi and 4G', type: 'video', duration: 18, xp: 28 },
            { title: 'Cloud Platforms for IoT', description: 'AWS IoT, Azure IoT Hub, and Google Cloud IoT', type: 'ppt', duration: 25, xp: 35 },
            { title: 'IoT Security Best Practices', description: 'Encryption, authentication, and securing IoT deployments', type: 'pdf', duration: 22, xp: 32 },
            { title: 'Real-World IoT Project', description: 'Build a weather monitoring system with data visualization', type: 'assignment', duration: 60, xp: 75 },
        ]
    },
    {
        title: 'Embedded Systems Development',
        slug: 'embedded-systems',
        description: 'Deep dive into embedded systems: firmware development, real-time operating systems, and hardware programming.',
        category: 'Embedded Systems',
        topics: ['Embedded Systems', 'C/C++', 'RTOS', 'Firmware', 'Hardware'],
        lessons: [
            { title: 'Embedded Systems Fundamentals', description: 'Understanding embedded systems architecture and constraints', type: 'video', duration: 20, xp: 30 },
            { title: 'Microcontroller Programming Basics', description: 'Writing efficient C/C++ for embedded devices', type: 'video', duration: 25, xp: 35 },
            { title: 'Memory Management in Embedded Systems', description: 'RAM, ROM, and flash memory optimization', type: 'ppt', duration: 18, xp: 28 },
            { title: 'Real-Time Operating Systems (RTOS)', description: 'FreeRTOS, embedded Linux, and task scheduling', type: 'pdf', duration: 30, xp: 40 },
            { title: 'Interrupt Handling & Timers', description: 'Managing interrupts and hardware timers effectively', type: 'video', duration: 22, xp: 32 },
            { title: 'Serial Communication Protocols', description: 'UART, SPI, I2C, and CAN bus communication', type: 'ppt', duration: 25, xp: 35 },
            { title: 'Low Power Design & Optimization', description: 'Battery optimization and power management techniques', type: 'pdf', duration: 20, xp: 30 },
            { title: 'Embedded Systems Project', description: 'Design and implement a real-time data logger', type: 'assignment', duration: 80, xp: 90 },
        ]
    },
    {
        title: 'Artificial Intelligence & Machine Learning',
        slug: 'ai-machine-learning',
        description: 'Comprehensive AI/ML course covering neural networks, deep learning, NLP, and computer vision with hands-on projects.',
        category: 'Artificial Intelligence',
        topics: ['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'Python'],
        lessons: [
            { title: 'AI & Machine Learning Introduction', description: 'Fundamentals of supervised and unsupervised learning', type: 'video', duration: 25, xp: 35 },
            { title: 'Linear Regression & Classification', description: 'Building predictive models with scikit-learn', type: 'ppt', duration: 28, xp: 38 },
            { title: 'Decision Trees & Random Forests', description: 'Ensemble learning methods and feature importance', type: 'video', duration: 22, xp: 32 },
            { title: 'Neural Networks Fundamentals', description: 'Perceptrons, backpropagation, and activation functions', type: 'pdf', duration: 30, xp: 40 },
            { title: 'Deep Learning with TensorFlow & Keras', description: 'Building convolutional and recurrent neural networks', type: 'video', duration: 35, xp: 45 },
            { title: 'Natural Language Processing (NLP)', description: 'Text processing, sentiment analysis, and language models', type: 'ppt', duration: 28, xp: 38 },
            { title: 'Computer Vision & Image Recognition', description: 'Image classification, object detection, and segmentation', type: 'video', duration: 30, xp: 40 },
            { title: 'AI/ML Capstone Project', description: 'Build an intelligent system with real-world data', type: 'assignment', duration: 120, xp: 150 },
        ]
    },
    {
        title: 'Data Science & Analytics',
        slug: 'data-science-analytics',
        description: 'Complete data science pathway: data wrangling, visualization, statistical analysis, and predictive modeling.',
        category: 'Data Science',
        topics: ['Data Science', 'Python', 'Statistics', 'Data Visualization', 'SQL'],
        lessons: [
            { title: 'Data Science Fundamentals', description: 'Data collection, cleaning, and exploratory analysis', type: 'video', duration: 20, xp: 30 },
            { title: 'SQL for Data Analysis', description: 'Advanced SQL queries, joins, and aggregations', type: 'ppt', duration: 25, xp: 35 },
            { title: 'Python for Data Science', description: 'Pandas, NumPy, and data manipulation techniques', type: 'video', duration: 28, xp: 38 },
            { title: 'Statistical Analysis & Hypothesis Testing', description: 'Descriptive and inferential statistics', type: 'pdf', duration: 24, xp: 34 },
            { title: 'Data Visualization & Communication', description: 'Matplotlib, Seaborn, and creating impactful visualizations', type: 'video', duration: 22, xp: 32 },
            { title: 'Time Series Analysis & Forecasting', description: 'ARIMA, seasonal decomposition, and prediction', type: 'ppt', duration: 26, xp: 36 },
            { title: 'Big Data Technologies', description: 'Apache Spark, Hadoop, and distributed computing', type: 'pdf', duration: 30, xp: 40 },
            { title: 'Data Science Project', description: 'End-to-end analysis and predictive modeling', type: 'assignment', duration: 100, xp: 120 },
        ]
    },
    {
        title: 'Web Development Masterclass',
        slug: 'web-development',
        description: 'Full-stack web development: HTML, CSS, JavaScript, React, Node.js, databases, and deployment.',
        category: 'Web Development',
        topics: ['Web Development', 'HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases'],
        lessons: [
            { title: 'Web Development Fundamentals', description: 'HTML, CSS, and responsive design principles', type: 'video', duration: 25, xp: 35 },
            { title: 'JavaScript Basics & DOM Manipulation', description: 'Core JavaScript concepts and browser APIs', type: 'ppt', duration: 28, xp: 38 },
            { title: 'Advanced JavaScript & ES6+', description: 'Promises, async/await, and modern JavaScript', type: 'video', duration: 30, xp: 40 },
            { title: 'Frontend Framework: React', description: 'Components, hooks, and state management', type: 'pdf', duration: 32, xp: 42 },
            { title: 'Backend with Node.js & Express', description: 'RESTful APIs, middleware, and server development', type: 'video', duration: 28, xp: 38 },
            { title: 'Database Design & SQL/NoSQL', description: 'Relational and document databases', type: 'ppt', duration: 26, xp: 36 },
            { title: 'Authentication & Security', description: 'JWT, OAuth, HTTPS, and secure coding practices', type: 'video', duration: 24, xp: 34 },
            { title: 'Full-Stack Web Project', description: 'Build a complete web application from scratch', type: 'assignment', duration: 150, xp: 180 },
        ]
    },
    {
        title: 'Mobile App Development',
        slug: 'mobile-app-development',
        description: 'Native and cross-platform mobile development: iOS, Android, React Native, and Flutter.',
        category: 'App Development',
        topics: ['Mobile Development', 'React Native', 'Flutter', 'iOS', 'Android'],
        lessons: [
            { title: 'Mobile App Development Overview', description: 'Native vs cross-platform, development approaches', type: 'video', duration: 20, xp: 30 },
            { title: 'React Native Fundamentals', description: 'Components, navigation, and platform-specific code', type: 'ppt', duration: 26, xp: 36 },
            { title: 'Flutter Basics & UI Design', description: 'Widgets, layouts, and beautiful UI creation', type: 'video', duration: 28, xp: 38 },
            { title: 'State Management in Mobile Apps', description: 'Redux, Provider pattern, and BLoC architecture', type: 'pdf', duration: 24, xp: 34 },
            { title: 'Working with APIs & Networking', description: 'HTTP requests, JSON parsing, and data handling', type: 'video', duration: 22, xp: 32 },
            { title: 'Local Storage & Databases', description: 'SQLite, Realm, and local data persistence', type: 'ppt', duration: 20, xp: 30 },
            { title: 'Testing, Debugging & Performance', description: 'Unit testing, debugging tools, and optimization', type: 'pdf', duration: 25, xp: 35 },
            { title: 'Mobile App Deployment', description: 'App Store, Play Store, and continuous deployment', type: 'assignment', duration: 60, xp: 80 },
        ]
    },
    {
        title: 'Cybersecurity Essentials',
        slug: 'cybersecurity',
        description: 'Comprehensive cybersecurity training: threat analysis, network security, encryption, ethical hacking, and compliance.',
        category: 'Cybersecurity',
        topics: ['Cybersecurity', 'Network Security', 'Encryption', 'Ethical Hacking', 'Compliance'],
        lessons: [
            { title: 'Cybersecurity Fundamentals', description: 'Threats, vulnerabilities, and risk management', type: 'video', duration: 22, xp: 32 },
            { title: 'Network Security & Firewalls', description: 'Network architecture, IDS/IPS, and DDoS protection', type: 'ppt', duration: 26, xp: 36 },
            { title: 'Cryptography & Encryption', description: 'Symmetric, asymmetric encryption, and key management', type: 'video', duration: 28, xp: 38 },
            { title: 'Web Application Security', description: 'OWASP top 10, SQL injection, XSS, and CSRF', type: 'pdf', duration: 25, xp: 35 },
            { title: 'Authentication & Access Control', description: 'Multi-factor authentication and privilege management', type: 'video', duration: 20, xp: 30 },
            { title: 'Incident Response & Forensics', description: 'Detecting, analyzing, and responding to attacks', type: 'ppt', duration: 24, xp: 34 },
            { title: 'Ethical Hacking & Penetration Testing', description: 'Authorized testing and vulnerability assessment', type: 'video', duration: 30, xp: 40 },
            { title: 'Security Project', description: 'Conduct security audit and create defense strategy', type: 'assignment', duration: 90, xp: 110 },
        ]
    },
    {
        title: 'Robotics & Autonomous Systems',
        slug: 'robotics-automation',
        description: 'Complete robotics training: robot design, kinematics, control systems, computer vision, and autonomous navigation.',
        category: 'Robotics',
        topics: ['Robotics', 'ROS', 'Computer Vision', 'Control Systems', 'Autonomous Navigation'],
        lessons: [
            { title: 'Robotics Fundamentals', description: 'Robot types, kinematics, and dynamics', type: 'video', duration: 25, xp: 35 },
            { title: 'Robot Operating System (ROS)', description: 'ROS architecture, nodes, topics, and services', type: 'ppt', duration: 28, xp: 38 },
            { title: 'Robot Perception & Vision', description: 'Cameras, LIDAR, and computer vision processing', type: 'video', duration: 26, xp: 36 },
            { title: 'Robot Control & Motion Planning', description: 'PID control, path planning, and trajectory optimization', type: 'pdf', duration: 30, xp: 40 },
            { title: 'Autonomous Navigation', description: 'Mapping, localization (SLAM), and navigation', type: 'video', duration: 28, xp: 38 },
            { title: 'Machine Learning for Robotics', description: 'Vision-based learning and intelligent decision making', type: 'ppt', duration: 26, xp: 36 },
            { title: 'Simulation & Testing', description: 'Gazebo simulation and testing frameworks', type: 'pdf', duration: 22, xp: 32 },
            { title: 'Robotics Capstone', description: 'Design and program an autonomous robot system', type: 'assignment', duration: 120, xp: 150 },
        ]
    },
    {
        title: 'Cloud Computing & DevOps',
        slug: 'cloud-devops',
        description: 'Master cloud platforms and DevOps practices: AWS, Azure, GCP, Docker, Kubernetes, CI/CD, and infrastructure as code.',
        category: 'Cloud & DevOps',
        topics: ['Cloud Computing', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps'],
        lessons: [
            { title: 'Cloud Computing Fundamentals', description: 'IaaS, PaaS, SaaS, and cloud service models', type: 'video', duration: 20, xp: 30 },
            { title: 'AWS Services Overview', description: 'EC2, S3, RDS, and popular AWS services', type: 'ppt', duration: 26, xp: 36 },
            { title: 'Docker & Containerization', description: 'Docker images, containers, and registry', type: 'video', duration: 24, xp: 34 },
            { title: 'Kubernetes Orchestration', description: 'Pods, services, deployments, and scaling', type: 'pdf', duration: 30, xp: 40 },
            { title: 'Infrastructure as Code (IaC)', description: 'Terraform, CloudFormation, and Ansible', type: 'video', duration: 26, xp: 36 },
            { title: 'CI/CD Pipelines', description: 'Jenkins, GitLab CI, GitHub Actions, and automation', type: 'ppt', duration: 25, xp: 35 },
            { title: 'Monitoring & Logging', description: 'Prometheus, ELK stack, and observability', type: 'video', duration: 23, xp: 33 },
            { title: 'Cloud Architecture Project', description: 'Design and deploy scalable cloud infrastructure', type: 'assignment', duration: 100, xp: 130 },
        ]
    },
    {
        title: 'UI/UX Design Principles',
        slug: 'ui-ux-design',
        description: 'Complete design education: user research, wireframing, prototyping, visual design, and design systems.',
        category: 'Design',
        topics: ['UI/UX Design', 'Figma', 'Design Thinking', 'User Research', 'Prototyping'],
        lessons: [
            { title: 'Design Thinking & UX Fundamentals', description: 'User-centered design and design process', type: 'video', duration: 22, xp: 32 },
            { title: 'User Research & Personas', description: 'Conducting research, creating personas, and understanding users', type: 'ppt', duration: 24, xp: 34 },
            { title: 'Information Architecture', description: 'Sitemap, user flows, and navigation design', type: 'video', duration: 20, xp: 30 },
            { title: 'Wireframing & Prototyping', description: 'Low-fidelity and high-fidelity prototypes with Figma', type: 'pdf', duration: 26, xp: 36 },
            { title: 'Visual Design & Branding', description: 'Color theory, typography, and brand systems', type: 'video', duration: 25, xp: 35 },
            { title: 'Interaction Design & Animations', description: 'Micro-interactions, transitions, and user feedback', type: 'ppt', duration: 22, xp: 32 },
            { title: 'Usability Testing & Accessibility', description: 'A/B testing, accessibility standards (WCAG)', type: 'video', duration: 23, xp: 33 },
            { title: 'Design Portfolio Project', description: 'Complete end-to-end design project from research to high-fidelity', type: 'assignment', duration: 80, xp: 100 },
        ]
    },
];

async function seedCourses() {
    console.log('🚀 Starting Course Seeding (10 Comprehensive Courses)...\n');

    try {
        // Get super admin (course creator)
        const admins = await sql`SELECT id FROM super_admins LIMIT 1`;
        if (!admins.length) {
            console.error('❌ No super admin found. Run basic seed first.');
            process.exit(1);
        }
        const adminId = admins[0].id;

        // Get all classes for course mapping
        const classes = await sql`SELECT id FROM classes ORDER BY level ASC`;
        const classIds = classes.map(c => c.id);

        console.log(`📚 Creating 10 courses with ${courses.length * courses[0].lessons.length} total lessons...\n`);

        let courseCount = 0;
        let lessonCount = 0;

        for (const courseData of courses) {
            const courseId = uuidv4();

            // Create course
            await sql`
                INSERT INTO courses (
                    id, title, slug, description, category, topics,
                    created_by, is_published, total_lessons, total_xp, all_classes
                ) VALUES (
                    ${courseId},
                    ${courseData.title},
                    ${courseData.slug},
                    ${courseData.description},
                    ${courseData.category},
                    ${courseData.topics},
                    ${adminId},
                    true,
                    ${courseData.lessons.length},
                    ${courseData.lessons.reduce((sum, l) => sum + l.xp, 0)},
                    true
                )
                ON CONFLICT DO NOTHING
            `;

            // Map course to all classes
            for (const classId of classIds) {
                await sql`
                    INSERT INTO course_class_mapping (course_id, class_id, is_active)
                    VALUES (${courseId}, ${classId}, true)
                    ON CONFLICT DO NOTHING
                `;
            }

            // Create lessons
            for (let i = 0; i < courseData.lessons.length; i++) {
                const lesson = courseData.lessons[i];
                const lessonId = uuidv4();

                await sql`
                    INSERT INTO lessons (
                        id, course_id, title, description, content_type,
                        sequence_order, duration_minutes, xp_reward, is_published
                    ) VALUES (
                        ${lessonId},
                        ${courseId},
                        ${lesson.title},
                        ${lesson.description},
                        ${lesson.type},
                        ${i + 1},
                        ${lesson.duration},
                        ${lesson.xp},
                        true
                    )
                    ON CONFLICT DO NOTHING
                `;

                lessonCount++;
            }

            courseCount++;
            if (courseCount % 2 === 0) {
                console.log(`   ✅ Created ${courseCount} courses (${lessonCount} lessons)...`);
            }
        }

        console.log('\n✅ Course Seeding Complete!\n');
        console.log('─────────────────────────────────────────────────────────');
        console.log('📊 Summary:');
        console.log(`   • Courses Created: ${courseCount}`);
        console.log(`   • Lessons Created: ${lessonCount}`);
        console.log(`   • Total XP Available: ${courses.reduce((sum, c) => sum + c.lessons.reduce((s, l) => s + l.xp, 0), 0)}`);
        console.log('─────────────────────────────────────────────────────────\n');

        console.log('📖 Courses Created:');
        courses.forEach((course, idx) => {
            console.log(`   ${idx + 1}. ${course.title}`);
            console.log(`      Category: ${course.category}`);
            console.log(`      Lessons: ${course.lessons.length}`);
            console.log(`      Topics: ${course.topics.join(', ')}\n`);
        });

        console.log('💡 Next Steps:');
        console.log('   1. Login as admin@technurture.com');
        console.log('   2. Upload course thumbnails');
        console.log('   3. Upload video files for video lessons');
        console.log('   4. Upload PDFs for pdf lessons');
        console.log('   5. Publish courses and make them available\n');

        await sql.end();
    } catch (error) {
        console.error('❌ Course seeding failed:', error);
        process.exit(1);
    }
}

seedCourses();
