Here is the **Execution Log & Knowledge Base** for your future reference. This documents the specific technical decisions made to optimize performance ("loading perfectly") while maintaining high-end visuals on desktop.

---

# 🚀 Dev Log: Performance & Animation Optimization

### **Objective**

Fix slow load times and "janky" scrolling on mobile while keeping high-fidelity animations on desktop.

### **1. The "Greater Than 6" Rule (Smart Image Loading)**

**The Problem:**
Originally, the browser tried to load **every** blog image the moment the page opened. This "traffic jam" of data choked the network, causing text to pop in late and the scroll to stutter.

**The Fix:**
We used Next.js's `priority` prop with a logic gate: `index < 6`.

- **How it works:**
- **Images 0–5 (The first 6):** These are given `priority={true}`. Next.js tells the browser, "Preload these immediately, even before the CSS is fully parsed." This makes the "Above the Fold" content appear instant.
- **Images 6+ (The rest):** These default to `loading="lazy"`. The browser ignores them until the user scrolls near them.

**Code Pattern:**

```jsx
{posts.map((post, index) => (
  <Image
    src={post.image}
    // If it's one of the first 6 images, load it NOW. Otherwise, wait.
    priority={index < 6}
    loading={index < 6 ? "eager" : "lazy"}
    ...
  />
))}

```

### **2. The "200%" Gradient Fix (Repaint Performance)**

**The Problem:**
You mentioned "taking away 200%." This refers to the CSS property `background-size: 200% auto`.

- **Context:** To animate a gradient moving (the "shimmer" effect), the background needs to be larger than the container (e.g., 200%) so we can slide it around.
- **The Cost:** On mobile devices, animating a background size or position triggers a "Paint" operation on every single frame (60 times a second). This eats up the phone's CPU/GPU, causing the rest of the page (like your blog text) to load slowly or stutter.

**The Fix:**
We removed this heavy rendering cost from mobile by **defaulting to a static background** and only applying the "200%" size and animation on Desktop.

**Code Pattern:**

```jsx
<div
  className="
  bg-gradient-to-r from-blue-600 to-teal-400
  
  /* MOBILE (Default): Static 100% size. No animation cost. */
  bg-[length:100%_auto]
  
  /* DESKTOP (md+): Large 200% size with animation. */
  md:bg-[length:200%_auto] 
  md:animate-gradient-xy
"
/>
```

### **3. Selectively Turning Off Animations on Mobile**

**The Logic:**
Mobile screens are small and often powered by batteries/weaker processors. Heavy animations (like floating planes or infinite tickers) can be distracting or draining.

**The Technique: Tailwind Breakpoints (`md:`)**
Tailwind is "mobile-first." This means standard classes apply to mobile. You use prefixes like `md:` (medium screens/tablets and up) to turn things _on_ for desktop.

**Example A: The Floating Plane**
If we want the plane to float on desktop but stay still on mobile:

```jsx
<div
  className="
  /* Base (Mobile): No animation */
  transform-none 
  
  /* Desktop: Apply the custom keyframe animation */
  md:animate-[plane-float_3s_ease-in-out_infinite]
"
>
  <Plane />
</div>
```

**Example B: The Ticker**
If we want the ticker to scroll on desktop but just sit still on mobile:

```jsx
/* In your CSS or Tailwind config */
<div className="
  /* Mobile: Static position */
  translate-y-0

  /* Desktop: Dynamic position based on state */
  md:translate-y-[-20px]
">

```

### **Summary Checklist for Future Projects**

1. **Images:** Always count your "Above the Fold" items. If you have a grid of 3, set `priority={index < 3}`. Never lazy load the main hero image.
2. **Gradients:** If a gradient moves, check the `background-size`. If it is `>100%`, wrap the animation class in `md:` so mobile phones don't have to calculate those pixels every frame.
3. **Animation Philosophy:**

- **Mobile:** Prioritize content load speed and scroll smoothness.
- **Desktop:** Add the "candy" (hover effects, infinite loops, heavy blurs).
