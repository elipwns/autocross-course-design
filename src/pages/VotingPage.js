import React, { useState } from 'react';

/**
 * VotingPage component - Page for voting on course designs
 */
function VotingPage() {
  const [courses, setCourses] = useState([
    { id: 1, name: 'Summer Slalom', votes: 0, description: 'A technical course with tight turns' },
    { id: 2, name: 'Speed Challenge', votes: 0, description: 'Fast course with long straights' },
    { id: 3, name: 'Hairpin Heaven', votes: 0, description: 'Multiple hairpin turns to test precision' },
  ]);

  const handleVote = (id) => {
    setCourses(courses.map(course => 
      course.id === id ? { ...course, votes: course.votes + 1 } : course
    ));
  };

  return (
    <div className="voting-page">
      <h1>Vote for Your Favorite Course</h1>
      <p>Browse through the community-designed autocross courses and vote for your favorites!</p>
      
      <div className="courses-list">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <h3>{course.name}</h3>
            <p>{course.description}</p>
            <div className="vote-section">
              <span className="vote-count">{course.votes} votes</span>
              <button onClick={() => handleVote(course.id)} className="vote-button">
                Vote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VotingPage;