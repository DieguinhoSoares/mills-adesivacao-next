<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script>
      // Redireciona qualquer rota 404 do GitHub Pages para o index.html
      // mantendo o path original para o React Router processar.
      var path = window.location.pathname;
      var base = '/mills-adesivacao-next';
      var rest = path.replace(base, '');
      sessionStorage.setItem('redirect', rest || '/');
      window.location.replace(base + '/');
    </script>
  </head>
  <body></body>
</html>
