import { ref, onMounted, onUnmounted, nextTick } from 'vue';

export default function useClickOutside(closeCallback) {
  const elementRef = ref(null);

  const handleClickOutside = (event) => {
    nextTick(() => {
      // Check if the click target is inside the popup
      const isInside = elementRef.value && elementRef.value.contains(event.target);
      if (!isInside) {
        console.log('Clicked outside of popup');
        closeCallback(); // Close the popup when clicking outside
      }
    });
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return {
    elementRef,
  };
}
