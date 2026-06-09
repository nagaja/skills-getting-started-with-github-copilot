document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

        // Participants section (built with DOM to attach handlers safely)
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';

        const participantsTitle = document.createElement('strong');
        participantsTitle.textContent = 'Participants:';
        participantsSection.appendChild(participantsTitle);

        const participantsUl = document.createElement('ul');
        participantsUl.className = 'participants-list';

        if (details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-participant';
            btn.title = 'Remove participant';
            btn.type = 'button';
            btn.textContent = '×';
            btn.dataset.activity = name;
            btn.dataset.email = p;

            // Delete handler
            btn.addEventListener('click', async (ev) => {
              ev.stopPropagation();
              const activityName = ev.currentTarget.dataset.activity;
              const email = ev.currentTarget.dataset.email;

              if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );

                const result = await resp.json().catch(() => ({}));

                if (resp.ok) {
                  // remove the participant from the UI
                  li.remove();

                  // update spots left in the card
                  const spotsEl = activityCard.querySelector('.spots-left');
                  if (spotsEl) {
                    const newSpots = Math.max(0, Number(spotsEl.textContent || 0) + 1);
                    spotsEl.textContent = String(newSpots);
                  }

                  messageDiv.textContent = result.message || 'Participant removed';
                  messageDiv.className = 'message success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                } else {
                  messageDiv.textContent = result.detail || 'Failed to remove participant';
                  messageDiv.className = 'message error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            participantsUl.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.innerHTML = '<em>No participants yet</em>';
          participantsUl.appendChild(li);
        }

        participantsSection.appendChild(participantsUl);
        activitiesList.appendChild(activityCard);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Update the corresponding activity card in the UI without refresh
        try {
          // Find the activity card by matching its title text
          let targetCard = null;
          document.querySelectorAll('.activity-card').forEach((card) => {
            const titleEl = card.querySelector('h4');
            if (titleEl && titleEl.textContent === activity) targetCard = card;
          });

          if (targetCard) {
            // Update spots left
            const spotsEl = targetCard.querySelector('.spots-left');
            if (spotsEl) {
              const newSpots = Math.max(0, Number(spotsEl.textContent || 0) - 1);
              spotsEl.textContent = String(newSpots);
            }

            // Update participants list
            const participantsUl = targetCard.querySelector('.participants-list');
            if (participantsUl) {
              // If the "No participants yet" message exists, clear it
              const firstLi = participantsUl.querySelector('li');
              if (firstLi && firstLi.textContent.trim() === 'No participants yet') {
                participantsUl.innerHTML = '';
              }

              // Create new list item for the added participant
              const li = document.createElement('li');
              li.className = 'participant-item';

              const span = document.createElement('span');
              span.className = 'participant-email';
              span.textContent = document.getElementById('email').value;

              const btn = document.createElement('button');
              btn.className = 'delete-participant';
              btn.title = 'Remove participant';
              btn.type = 'button';
              btn.textContent = '×';
              btn.dataset.activity = activity;
              btn.dataset.email = span.textContent;

              // Attach same delete handler as other buttons
              btn.addEventListener('click', async (ev) => {
                ev.stopPropagation();
                const activityName = ev.currentTarget.dataset.activity;
                const emailAddr = ev.currentTarget.dataset.email;

                if (!confirm(`Unregister ${emailAddr} from ${activityName}?`)) return;

                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(emailAddr)}`,
                    { method: 'DELETE' }
                  );

                  const res = await resp.json().catch(() => ({}));

                  if (resp.ok) {
                    li.remove();
                    const spotsEl2 = targetCard.querySelector('.spots-left');
                    if (spotsEl2) {
                      const newSpots2 = Math.max(0, Number(spotsEl2.textContent || 0) + 1);
                      spotsEl2.textContent = String(newSpots2);
                    }
                    messageDiv.textContent = res.message || 'Participant removed';
                    messageDiv.className = 'message success';
                    messageDiv.classList.remove('hidden');
                    setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                  } else {
                    messageDiv.textContent = res.detail || 'Failed to remove participant';
                    messageDiv.className = 'message error';
                    messageDiv.classList.remove('hidden');
                  }
                } catch (err) {
                  console.error('Error removing participant:', err);
                  messageDiv.textContent = 'Failed to remove participant';
                  messageDiv.className = 'message error';
                  messageDiv.classList.remove('hidden');
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              participantsUl.appendChild(li);
            }
          }
        } catch (uiErr) {
          console.error('Error updating UI after signup:', uiErr);
        }

        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
