# **App Name**: LLM Config Manager

## Core Features:

- Admin Authentication: Implement basic authentication so only an admin can log in to the system, using Laravel's built-in auth system. Restrict access to the configuration page to only the admin with middleware.
- Configuration Storage: Create and manage a simple 'llm_config' table to store the LLM API parameters. All parameters will be editable only by the admin.
- Parameter Management UI: Provide an admin dashboard to edit LLM parameters like max_tokens and temperature. Admin users can modify the settings via forms.
- Saving current settings: Admin user to save the current settings to persist them.

## Style Guidelines:

- Primary color: HSL(210, 70%, 50%) - A vibrant blue that suggests configuration and control, converting to hex code #3399FF.
- Background color: HSL(210, 20%, 95%) - Light, desaturated blue (#F0F5FF) to provide a calm, neutral backdrop.
- Accent color: HSL(180, 60%, 40%) - Teal (#339980) used for secondary actions and highlights, offering a visual contrast.
- Headline font: 'Space Grotesk' (sans-serif) for headlines and primary UI elements, lending a modern tech feel.
- Body font: 'Inter' (sans-serif) will provide a neutral and modern look.
- Use simple, line-based icons to represent settings and configuration options.
- Use a clean, modern layout with clear visual hierarchy to ensure that settings are easy to locate and modify.
- Implement subtle transitions and feedback animations when saving configurations to provide a polished user experience.