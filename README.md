# PROJECT OVERVIEW

**backend** -> Already has ai and 3d models.

**fe** -> is the new frontend which is in next js but doesnt have ai and 3d models.

**frontend** -> is the old frontend which is in next js and has ai and 3d models.

# TASKS

-   we need to move the ai and 3d models to the new frontend
-   redesign 3d model frontend so we can use any 3d model, right now it is limited to the ones in the frontend
-   add admin panel to the new frontend
-   we need to refactor the backend routes because the routes are based on typical e-commerce clothing store routes but since we introduced 3d models and ai and royalty system and has enabled users to setup their own stores, the routes are not suitable anymore and need to be refactored
-   we need to add a new route for the 3d model viewer (in case user wants to use their own 3d model)
-   I think authentication need to be changed from manually added something in header to cookie based authentication with site origin, secure flag, http only flag, max age 30 days and we need to setup a middleware to check if the user is authenticated and if not, it will redirect to the login page that way frontend doesnt to specifically handle the api call by sending the "x-api-key header".
