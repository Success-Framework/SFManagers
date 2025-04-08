import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Define a simplified startup interface
interface Startup {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

const StartupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        // Fetch the startup data
        const response = await fetch(`/api/startups/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch startup');
        }
        const data = await response.json();
        setStartup(data);
      } catch (error) {
        console.error('Error fetching startup:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStartup();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!startup) {
    return <div>Startup not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1>{startup.name}</h1>
      <p>{startup.description}</p>
      <button onClick={() => navigate(-1)}>Back</button>
    </motion.div>
  );
};

export default StartupDetails; 