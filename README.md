# Meu Caderno Digital — versão completa

Sistema multiusuário em Next.js + TypeScript + Firebase + Bootstrap.

## Incluído
- Login, cadastro e recuperação de senha.
- Isolamento dos dados por usuário.
- Anotações, prioridades por cor, categorias e tags.
- Pesquisa dentro do título, texto, tags e checklist.
- Filtros avançados.
- Compromissos com data e hora.
- Calendário mensal.
- Recorrência diária, semanal, mensal e anual.
- Lembretes do navegador enquanto o app estiver aberto/ativo.
- Checklist dentro da anotação.
- Anexos e fotos via Firebase Storage.
- Favoritos, fixados, concluídos e arquivados.
- Lixeira com restauração e exclusão definitiva.
- Histórico de versões ao editar notas.
- Perfil e modo escuro.
- Exportação de uma nota ou resultados filtrados para PDF A4 pronto para imprimir.
- Exportação CSV e backup JSON.
- PWA instalável no celular/desktop.

## Firebase
### Authentication
Ative `Email/Password` em Authentication > Sign-in method.

### Firestore
Crie o Firestore e publique o arquivo `firestore.rules`.

### Storage
Ative o Firebase Storage e publique `storage.rules`.

## .env.local
O arquivo já está incluído neste pacote com a configuração fornecida. Para outro projeto Firebase, use:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Rodar
```bash
npm install
npm run dev
```
Abra http://localhost:3000

## Validar produção
```bash
npm run build
npm start
```

## Exportar PDF
Na tela principal use `Exportar > PDF para imprimir`. O PDF utiliza os resultados atualmente filtrados. Cada cartão também possui o ícone PDF para gerar somente aquela anotação.

## Lembretes
Clique no sino no topo e autorize notificações. Os lembretes locais são disparados quando o sistema estiver aberto/ativo no navegador. Para push totalmente em segundo plano com o navegador fechado, seria necessário adicionar um backend agendador/Cloud Functions + FCM.

## Publicar no Vercel
Cadastre as variáveis `NEXT_PUBLIC_FIREBASE_*` em Settings > Environment Variables e faça deploy normalmente.
