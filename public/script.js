$(document).ready(function () {

    fetch('/me')
    .then(response => response.json())
    .then(user => {
        if (user) {
            $('.menu-list a[href="login.html"]').parent().hide();
            $('.menu-list a[href="registration.html"]').parent().hide();
            $('.mobile-menu-list a[href="login.html"]').parent().hide();
            $('.mobile-menu-list a[href="registration.html"]').parent().hide();
        } else {
            $('.user-menu').hide(); // Hide the user menu if no user is logged in
        }
    })
    .catch(error => {
        console.error('Error fetching user:', error);
        $('.user-menu').hide(); // Also hide in case of an error
    });

$(document).on("click", "#signout", function (e) {  // Use event delegation
    e.preventDefault();
    fetch("/logout", { method: "POST" })
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(error => {
            alert('An error occurred while logging out. Please try again later.');
        });
});

    $(".hamburger-menu").on("click", function (e) {
        e.stopPropagation()
        $(".mobile-navigation-drawer").toggleClass("hidden");
        setTimeout(function() {
            $(".mobile-menu-container").toggleClass("open");
        }, 1);
        $("body").toggleClass("no-scroll");
    });

    $(".mobile-navigation-drawer").on("click", function (e) {
        e.stopPropagation()
        if (!$(e.target).closest(".mobile-menu-container").length) {
            $(".mobile-menu-container").removeClass("open"); 
            setTimeout(function() {
                $(".mobile-navigation-drawer").removeClass("hidden");
            }, 200);
            $("body").removeClass("no-scroll");
        }
    });


    $("#my-form").on("submit", function (event) {
    
        const name = $('#name').val().trim();
        const email = $('#email').val().trim();


         if (!name || !email) {
            event.preventDefault();
            alert('Name and Email are required!');
            return
        }

        alert("Form submitted successfully!");
    });

    $(".thumbnail-image").click(function () {
        const imageUrl = $(this).attr("src");
        $("#large-image").attr("src", imageUrl); 
        $("#image-viewer").addClass("active");
        $("body").toggleClass("no-scroll");
      });
    
      $(".close").click(function () {
        $("#image-viewer").removeClass("active"); 
        $("body").removeClass("no-scroll");
      });
    
      $("#image-viewer").click(function (e) {
        if (e.target.id === "image-viewer") {
          $(this).removeClass("active");
          $("body").removeClass("no-scroll");
        }
      });


      $(".menu-list-with-sub-menu-container").on("click", function () {
        $(this).next(".mobile-menu-list").slideToggle(300);
        $(".menu-list-with-sub-menu-container")
            .not(this)
            .next(".mobile-menu-list")
            .slideUp(300);
    });
});
