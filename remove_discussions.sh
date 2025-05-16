#!/bin/bash
# Remove Discussion-related code from the codebase

# 1. Remove discussion routes file
echo "Removing discussion.routes.js..."
rm -f src/routes/discussion.routes.js

# 2. Remove discussion import and routes from server.js
echo "Updating server.js..."
sed -i '/discussionRoutes/d' src/server.js
sed -i '/Mount discussion routes/d' src/server.js
sed -i '/startupRouter.use.*discussions/d' src/server.js

# 3. Remove discussion-related components from TaskManagementPage.tsx
echo "Updating TaskManagementPage.tsx..."
# Remove interfaces
sed -i '/interface Discussion/,/^}/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/interface DiscussionComment/,/^}/d' src/client/components/task/TaskManagementPage.tsx

# Remove state variables
sed -i '/\[activeDiscussion/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/\[discussions/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/\[selectedDiscussion/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/\[discussionComments/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/\[showNewDiscussionModal/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/\[newDiscussionForm/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/\[loadingDiscussions/d' src/client/components/task/TaskManagementPage.tsx

# Remove navigation item
sed -i '/name:.*Discussion/,/},/d' src/client/components/task/TaskManagementPage.tsx

# Remove functions
sed -i '/const fetchDiscussions/,/^  };/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/const fetchDiscussionComments/,/^  };/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/const handleCreateDiscussion/,/^  };/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/const handleAddComment/,/^  };/d' src/client/components/task/TaskManagementPage.tsx
sed -i '/const renderDiscussionBoard/,/^  );/d' src/client/components/task/TaskManagementPage.tsx

# Remove case from renderContent
sed -i '/case.*discussion/d' src/client/components/task/TaskManagementPage.tsx

# 4. Remove FaDiscourse import
sed -i 's/FaDiscourse, //g' src/client/components/task/TaskManagementPage.tsx

# 5. Create SQL script to drop discussion tables
echo "Created script to drop discussion tables. Run this manually if desired."
echo "DROP TABLE IF EXISTS DiscussionComment;" > drop_discussion_tables.sql
echo "DROP TABLE IF EXISTS Discussion;" >> drop_discussion_tables.sql

echo "Cleanup complete!" 