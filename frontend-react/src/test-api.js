// src/test-api.js

import { studentService, courseService, subjectService, gradeService, attendanceService } from './services/api';

async function testAPI() {
  console.log('🧪 Testing API Connection...\n');

  try {
    // Test 1: Students
    console.log('1️⃣ Testing Students API...');
    const students = await studentService.getAll();
    console.log(`   ✅ Found ${students.length} students`);
    if (students.length > 0) {
      console.log('   First student:', students[0]);
    }

    // Test 2: Courses
    console.log('\n2️⃣ Testing Courses API...');
    const courses = await courseService.getAll();
    console.log(`   ✅ Found ${courses.length} courses`);
    if (courses.length > 0) {
      console.log('   First course:', courses[0]);
    }

    // Test 3: Subjects
    console.log('\n3️⃣ Testing Subjects API...');
    const subjects = await subjectService.getAll();
    console.log(`   ✅ Found ${subjects.length} subjects`);
    if (subjects.length > 0) {
      console.log('   First subject:', subjects[0]);
    }

    // Test 4: Grades
    console.log('\n4️⃣ Testing Grades API...');
    if (students.length > 0) {
      const grades = await gradeService.getByStudent(students[0].id);
      console.log(`   ✅ Found ${grades.length} grades for ${students[0].firstName}`);
      if (grades.length > 0) {
        console.log('   First grade:', grades[0]);
      }
    }

    // Test 5: Attendance
    console.log('\n5️⃣ Testing Attendance API...');
    if (courses.length > 0) {
      const attendance = await attendanceService.getByCourseAndMonth(courses[0].id, 2026, 2);
      console.log(`   ✅ Found ${attendance.length} attendance records`);
      if (attendance.length > 0) {
        console.log('   First attendance:', attendance[0]);
      }
    }

    console.log('\n✅ All API tests passed!');
  } catch (error) {
    console.error('\n❌ API Test Failed:', error);
    console.error('Error details:', error.response?.data || error.message);
  }
}

// Ejecutar tests
testAPI();
