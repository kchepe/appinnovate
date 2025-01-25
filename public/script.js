$(document).ready(function () {

    // Fetch the logged-in user data
    fetch('/me')
    .then(response => response.json())
    .then(user => {
        if (user) {
            // Hide login and registration links when a user is logged in
            $('.menu-list a[href="login.html"]').parent().hide();
            $('.menu-list a[href="registration.html"]').parent().hide();
            $('.mobile-menu-list a[href="login.html"]').parent().hide();
            $('.mobile-menu-list a[href="registration.html"]').parent().hide();
        } else {
            // Hide the user menu if no user is logged in
            $('.user-menu').hide();
        }
    })
    .catch(error => {
        console.error('Error fetching user:', error);
        $('.user-menu').hide(); // Hide user menu in case of an error
    });

    // Handle user logout
    $(document).on("click", "#signout", function (e) {  
        e.preventDefault(); // Prevent default anchor behavior
        fetch("/logout", { method: "POST" })
            .then(() => {
                // Redirect to the homepage after logging out
                window.location.href = 'index.html';
            })
            .catch(error => {
                alert('An error occurred while logging out. Please try again later.');
            });
    });

    // Handle mobile menu toggle
    $(".hamburger-menu").on("click", function (e) {
        e.stopPropagation(); // Prevent click event from bubbling up
        $(".mobile-navigation-drawer").toggleClass("hidden");
        setTimeout(function() {
            $(".mobile-menu-container").toggleClass("open");
        }, 1);
        $("body").toggleClass("no-scroll"); // Prevent scrolling when menu is open
    });

    // Close mobile menu when clicking outside of it
    $(".mobile-navigation-drawer").on("click", function (e) {
        e.stopPropagation(); // Prevent click event from propagating
        if (!$(e.target).closest(".mobile-menu-container").length) {
            $(".mobile-menu-container").removeClass("open"); 
            setTimeout(function() {
                $(".mobile-navigation-drawer").removeClass("hidden");
            }, 200);
            $("body").removeClass("no-scroll"); // Re-enable scrolling
        }
    });

    // Form validation before submission
    $("#my-form").on("submit", function (event) {
        const name = $('#name').val().trim();
        const email = $('#email').val().trim();

        if (!name || !email) {
            event.preventDefault(); // Prevent form submission if fields are empty
            alert('Name and Email are required!');
            return;
        }

        alert("Form submitted successfully!");
    });

    // Handle image preview functionality
    $(".thumbnail-image").click(function () {
        const imageUrl = $(this).attr("src"); // Get clicked image URL
        $("#large-image").attr("src", imageUrl); // Set it as the large preview image
        $("#image-viewer").addClass("active"); // Show the image viewer
        $("body").toggleClass("no-scroll"); // Prevent scrolling when image is viewed
    });

    // Close image viewer when clicking the close button
    $(".close").click(function () {
        $("#image-viewer").removeClass("active"); // Hide the image viewer
        $("body").removeClass("no-scroll"); // Re-enable scrolling
    });

    // Close image viewer when clicking outside the image
    $("#image-viewer").click(function (e) {
        if (e.target.id === "image-viewer") {
            $(this).removeClass("active");
            $("body").removeClass("no-scroll"); // Re-enable scrolling
        }
    });

    // Toggle sub-menu dropdown in mobile navigation
    $(".menu-list-with-sub-menu-container").on("click", function () {
        $(this).next(".mobile-menu-list").slideToggle(300); // Toggle the clicked menu
        $(".menu-list-with-sub-menu-container")
            .not(this) // Find other menu containers
            .next(".mobile-menu-list")
            .slideUp(300); // Close other menus
    });


    $(".menu-btn").click(function () {
        $(".sidebar").addClass("open");
    });

    $(".close-btn").click(function () {
        $(".sidebar").removeClass("open");
    });

    // Close sidebar if user clicks outside
    $(document).click(function (event) {
        if (!$(event.target).closest(".sidebar, .menu-btn").length) {
            $(".sidebar").removeClass("open");
        }
    });

});
