// Add experience to user profile
router.post('/profile/experience', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, company, location, startDate, endDate, current, description, position } = req.body;
        
        if (!title || !company || !startDate) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }
        
        const experience = await prisma.experience.create({
            data: {
                position: position || title, // Use position as primary field
                company,
                location,
                startDate: new Date(startDate),
                endDate: current ? null : endDate ? new Date(endDate) : null,
                current: !!current,
                description,
                userId
            }
        });
        
        return res.status(201).json(experience);
    }
    catch (error) {
        console.error('Error adding experience:', error);
        return res.status(500).json({ error: 'Failed to add experience' });
    }
});

// Update experience
router.put('/profile/experience/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, company, location, startDate, endDate, current, description, position } = req.body;
        
        // Check if experience exists and belongs to the user
        const existingExperience = await prisma.experience.findUnique({
            where: { id }
        });
        
        if (!existingExperience) {
            return res.status(404).json({ error: 'Experience not found' });
        }
        
        if (existingExperience.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this experience' });
        }
        
        const updatedExperience = await prisma.experience.update({
            where: { id },
            data: {
                position: position || title, // Use position as primary field
                company,
                location,
                startDate: new Date(startDate),
                endDate: current ? null : endDate ? new Date(endDate) : null,
                current: !!current,
                description
            }
        });
        
        return res.json(updatedExperience);
    }
    catch (error) {
        console.error('Error updating experience:', error);
        return res.status(500).json({ error: 'Failed to update experience' });
    }
}); 