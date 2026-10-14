/* QuietSpace frontend prototype
 * Uses localStorage only. This is a learning/demo implementation, not secure authentication.
 */
(() => {
  const KEYS = { users: "quietspace_users_v1", session: "quietspace_session_v1", posts: "quietspace_posts_v1", profile: "quietspace_profile_v1", likes: "quietspace_likes_v1" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const session = () => read(KEYS.session, null);
  const user = () => { const s = session(); return s ? (read(KEYS.users, []).find(u => u.username === s.username) || null) : null; };
  const profile = () => read(KEYS.profile, { displayName: user()?.displayName || "QuietSpace Member", bio: "Here to share ideas and learn from others." });
  const escapeHTML = (str = "") => String(str).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const initials = (name = "Q") => name.trim().split(/\s+/).slice(0,2).map(s => s[0] || "").join("").toUpperCase() || "Q";
  const go = page => { location.href = page; };
  const setMessage = (node, message, error = false) => { if (!node) return; node.textContent = message; node.style.color = error ? "#a33b3b" : ""; };
  const ensureDemoPosts = () => {
    // Seed the feed with picture memes and remove older text-only demo examples.
    // Posts created by the visitor are kept as-is.
    const savedPosts = read(KEYS.posts, []);
    const priorPosts = Array.isArray(savedPosts) ? savedPosts : [];
    const now = Date.now();
    const defaults = [
      {
        id: "sample-privacy-meme", username: "mira", displayName: "Mira Sol",
        text: "When someone asks for your password ‘just to check something’… nope. Protect your peace and your privacy. 😭🔒",
        image: "../assets/img/privacy-meme.jpg",
        imageAlt: "Gandalf meme reading: You shall not violate my privacy.",
        createdAt: now - 3600000, likes: 12, sample: true
      },
      {
        id: "sample-karma-meme", username: "kai", displayName: "Kai Rivera",
        text: "Me judging somebody for the exact thing I did yesterday. Hindi ka ba kakarmahin niyan? 😭",
        image: "../assets/img/karma-meme.jpg",
        imageAlt: "Meme text asking, ‘hindi kaba karmahin nyan?’",
        createdAt: now - 7200000, likes: 18, sample: true
      },
      {
        id: "sample-cat-filter-meme", username: "sol", displayName: "Sol Bennett",
        text: "POV: you said ‘I’m not attached’ but your face is already giving this energy. 🥹🐱",
        image: "../assets/img/cat-filter-meme.jpg",
        imageAlt: "A man making a cute face with a cat-ear and blush filter.",
        createdAt: now - 14400000, likes: 23, sample: true
      },
      {
        id: "sample-reaction-meme", username: "mira", displayName: "Mira Sol",
        text: "When the group chat says ‘may sasabihin ako’ and you start reviewing every message you sent this week. 👀",
        image: "../assets/img/reaction-meme.jpg",
        imageAlt: "A reaction meme showing two men with intense expressions.",
        createdAt: now - 28800000, likes: 15, sample: true
      }
    ].map(sample => {
      const previous = priorPosts.find(post => post.id === sample.id);
      return previous ? { ...sample, createdAt: previous.createdAt || sample.createdAt, likes: Number.isFinite(previous.likes) ? previous.likes : sample.likes } : sample;
    });
    const visitorPosts = priorPosts.filter(post => !post.sample);
    write(KEYS.posts, [...defaults, ...visitorPosts]);
  };
  const relativeTime = time => { const mins = Math.max(0, Math.floor((Date.now() - time) / 60000)); if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`; const hours = Math.floor(mins/60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours/24)}d ago`; };
  const renderPost = post => {
    const current = user();
    const mine = current && post.username === current.username && !post.sample;
    const liked = read(KEYS.likes, []).includes(post.id);
    const media = post.image ? `<figure class="post-media"><img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.imageAlt || "Post image")}" loading="lazy"></figure>` : "";
    const text = post.text ? `<p class="post-text">${escapeHTML(post.text)}</p>` : "";
    return `<article class="post-card" data-post-id="${escapeHTML(post.id)}"><div class="post-head"><span class="avatar ${post.username === "kai" ? "lilac" : post.username === "sol" ? "peach" : "mint"}">${escapeHTML(initials(post.displayName))}</span><div><div class="post-author">${escapeHTML(post.displayName)}</div><div class="post-handle">@${escapeHTML(post.username)}</div></div><span class="post-time">${relativeTime(post.createdAt)}</span></div>${text}${media}<div class="post-actions"><button class="post-action ${liked ? "liked" : ""}" data-like="${escapeHTML(post.id)}" aria-pressed="${liked}">♡ ${post.likes || 0} likes</button>${mine ? `<button class="post-action" data-delete="${escapeHTML(post.id)}">Delete</button>` : ""}</div></article>`;
  };
  const renderPosts = (target, posts) => { if (target) target.innerHTML = posts.length ? posts.slice().sort((a,b) => b.createdAt-a.createdAt).map(renderPost).join("") : '<div class="panel muted">No posts yet. Share your first thought above.</div>'; };
  const updateAvatar = () => { const p = profile(); document.querySelectorAll("[data-avatar]").forEach(el => { el.textContent = initials(p.displayName || user()?.username || "Q"); }); };
  const requireSession = () => { if (!session() && !["", "index.html", "login.html", "signup.html"].some(s => location.pathname.endsWith(s))) go("login.html"); };
  // Auth forms: intentionally lightweight demo behavior. Passwords are NOT hashed.
  document.querySelectorAll("[data-auth]").forEach(form => form.addEventListener("submit", e => {
    e.preventDefault(); const data = new FormData(form); const username = String(data.get("username") || "").trim().toLowerCase(); const password = String(data.get("password") || ""); const message = $(".form-message", form);
    let users = read(KEYS.users, []);
    if (form.dataset.auth === "signup") {
      const displayName = String(data.get("displayName") || "").trim();
      if (users.some(u => u.username === username)) return setMessage(message, "That username is already taken on this browser.", true);
      users.push({ username, password, displayName }); write(KEYS.users, users); write(KEYS.session, { username }); write(KEYS.profile, { displayName, bio: "Here to share ideas and learn from others." }); go("feed.html");
    } else {
      const found = users.find(u => u.username === username && u.password === password);
      if (!found) return setMessage(message, "We couldn't find a matching demo account. Try signing up first.", true);
      write(KEYS.session, { username }); go("feed.html");
    }
  }));
  document.querySelectorAll("[data-logout]").forEach(button => button.addEventListener("click", () => { localStorage.removeItem(KEYS.session); go("../index.html"); }));
  // Feed composer and post interactions, including local picture attachments.
  const publish = $("#publish-post");
  if (publish) {
    ensureDemoPosts();
    const textarea = $("#post-content"), message = $("#post-message");
    const imageInput = $("#post-image-input"), attachButton = $("#attach-image");
    const previewWrap = $("#image-preview-wrap"), previewImage = $("#image-preview");
    const previewName = $("#image-preview-name"), removeImage = $("#remove-image");
    let selectedImage = "", selectedImageAlt = "";

    const resetSelectedImage = () => {
      selectedImage = ""; selectedImageAlt = "";
      if (imageInput) imageInput.value = "";
      if (previewImage) previewImage.removeAttribute("src");
      previewWrap?.classList.add("hidden");
      attachButton?.classList.remove("has-image");
    };
    const showSelectedImage = (dataUrl, fileName) => {
      selectedImage = dataUrl;
      selectedImageAlt = `Picture attached: ${fileName || "uploaded image"}`;
      if (previewImage) previewImage.src = dataUrl;
      if (previewName) previewName.textContent = fileName || "Picture attached";
      previewWrap?.classList.remove("hidden");
      attachButton?.classList.add("has-image");
    };

    attachButton?.addEventListener("click", () => imageInput?.click());
    imageInput?.addEventListener("change", () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        resetSelectedImage(); setMessage(message, "Choose an image file, such as JPG, PNG, or WebP.", true); return;
      }
      if (file.size > 10 * 1024 * 1024) {
        resetSelectedImage(); setMessage(message, "That image is over 10 MB. Choose a smaller picture.", true); return;
      }
      setMessage(message, "Preparing picture…");
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const maxSide = 1280;
          const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          // Use a white background so transparent images remain readable after JPEG compression.
          context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
          showSelectedImage(dataUrl, file.name);
          setMessage(message, "Picture attached. Add a caption or publish the picture by itself.");
        } catch {
          resetSelectedImage(); setMessage(message, "This picture could not be prepared. Try another image.", true);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl); resetSelectedImage();
        setMessage(message, "This picture could not be opened. Try another image file.", true);
      };
      image.src = objectUrl;
    });
    removeImage?.addEventListener("click", () => {
      resetSelectedImage(); setMessage(message, "Picture removed. You can attach another one.");
    });

    publish.addEventListener("click", () => {
      const current = user();
      if (!current) { setMessage(message, "Please log in to publish a post.", true); return; }
      const text = textarea.value.trim();
      if (!text && !selectedImage) { setMessage(message, "Write something or attach a picture first.", true); return; }
      const posts = read(KEYS.posts, []), p = profile();
      const post = {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        username: current.username, displayName: p.displayName || current.displayName,
        text, createdAt: Date.now(), likes: 0
      };
      if (selectedImage) { post.image = selectedImage; post.imageAlt = selectedImageAlt; }
      posts.push(post);
      try {
        write(KEYS.posts, posts);
      } catch {
        setMessage(message, "The picture could not be saved because this browser's storage is full. Remove older demo data or choose a smaller image.", true);
        return;
      }
      textarea.value = ""; resetSelectedImage();
      setMessage(message, "Your post was added to this browser's demo feed.");
      renderPosts($("#feed-list"), posts);
    });
    renderPosts($("#feed-list"), read(KEYS.posts, []));
  }
  document.addEventListener("click", e => {
    const like = e.target.closest("[data-like]");
    if (like) { const id = like.dataset.like, likes = read(KEYS.likes, []); const posts = read(KEYS.posts, []); const post = posts.find(p => p.id === id); if (!post) return; if (likes.includes(id)) { write(KEYS.likes, likes.filter(x => x !== id)); post.likes = Math.max(0, (post.likes || 0) - 1); } else { likes.push(id); write(KEYS.likes, likes); post.likes = (post.likes || 0) + 1; } write(KEYS.posts, posts); renderPosts($("#feed-list"), posts); renderPosts($("#profile-posts"), posts.filter(p => user() && p.username === user().username)); }
    const del = e.target.closest("[data-delete]");
    if (del && confirm("Delete this local demo post?")) { const posts = read(KEYS.posts, []).filter(p => p.id !== del.dataset.delete); write(KEYS.posts, posts); renderPosts($("#feed-list"), posts); renderPosts($("#profile-posts"), posts.filter(p => user() && p.username === user().username)); }
  });
  // Profile page
  if ($("#profile-form")) {
    const current = user(), p = profile(); $("#profile-display").textContent = p.displayName || current?.displayName || "QuietSpace Member"; $("#profile-handle").textContent = `@${current?.username || "guest"}`; $("#profile-bio").textContent = p.bio || ""; $("#display-name").value = p.displayName || current?.displayName || ""; $("#profile-bio-input").value = p.bio || "";
    const posts = read(KEYS.posts, []).filter(post => current && post.username === current.username && !post.sample); $("#profile-post-count").textContent = posts.length; renderPosts($("#profile-posts"), posts);
    $("#profile-form").addEventListener("submit", e => { e.preventDefault(); const displayName = $("#display-name").value.trim(), bio = $("#profile-bio-input").value.trim(); if (!displayName) return; write(KEYS.profile, { displayName, bio }); const users = read(KEYS.users, []); const me = users.find(u => current && u.username === current.username); if (me) { me.displayName = displayName; write(KEYS.users, users); } $("#profile-display").textContent = displayName; $("#profile-bio").textContent = bio; setMessage($(".form-message", e.currentTarget), "Profile saved locally."); updateAvatar(); });
  }
  // Topic search
  const search = $("#explore-search");
  if (search) search.addEventListener("input", () => { const query = search.value.toLowerCase().trim(); let shown = 0; document.querySelectorAll("[data-topic]").forEach(card => { const match = (card.dataset.topic + " " + card.textContent).toLowerCase().includes(query); card.classList.toggle("hidden", !match); if (match) shown++; }); $("#no-topics").classList.toggle("hidden", shown > 0); });
  // Export and delete controls
  $("#export-data")?.addEventListener("click", () => { const bundle = { exportedAt: new Date().toISOString(), users: read(KEYS.users, []), profile: read(KEYS.profile, null), posts: read(KEYS.posts, []), note: "QuietSpace frontend prototype export. Passwords may be included; keep this file private and delete it when finished." }; const blob = new Blob([JSON.stringify(bundle, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "quietspace-demo-data.json"; a.click(); URL.revokeObjectURL(url); setMessage($("#settings-message"), "Export started. Store the file carefully."); });
  $("#clear-data")?.addEventListener("click", () => { if (!confirm("Clear all QuietSpace demo data saved in this browser? This cannot be undone.")) return; Object.values(KEYS).forEach(k => localStorage.removeItem(k)); setMessage($("#settings-message"), "Local demo data cleared. Returning to the welcome page…"); setTimeout(() => go("../index.html"), 900); });
  updateAvatar();
  // Avoid silently exposing app pages to logged-out visitors; static demo navigation remains available.
  requireSession();
})();
