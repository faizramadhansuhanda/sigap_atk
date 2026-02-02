<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Sistem Monitoring Pengendalian ATK UP Pekanbaru</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
