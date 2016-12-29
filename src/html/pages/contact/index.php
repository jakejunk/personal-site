<!DOCTYPE html>
<html lang="en-US">
	<head>
        @@include("html/widgets/head.html")@@
		<title>Jake Junker - Contact</title>
	</head>
	<body>
		@@include("html/widgets/nav-bar.html", {"current": "contact"})@@

        <div id="main-container">
            <section id="main">
                <article class="color-shift" id="main-content">
                    <h1 class="main-header">Contact</h1>
                    <h2 class="section-header">Wanna Chat?</h2>
                    <p>Are you wanting to give a hard-working college student some <span title="...or money?">encouragment</span>? How about telling him that his website is awesome? What about letting him know about something he messed up over in <a href="/projects/">projects</a>? If you said yes to any of those options, then this page is for you!</p>
                    <div class="center-align">
                        <h2 class="red-text">NOTE: Form does not work yet!</h2>
                        <span class="whisper">(Looks good though!)</span>
                    </div>
                    <div class="flex-container flex-mobile-wrap" style="margin-top: 48px;">
                        <div id="contact-pane">
                            <h3 class="sub-section-header" style="margin-top: 0">Contact Info</h3>
                            <ul class="list-no-style">
                                <li><a href="mailto:contact@jakejunker.com?Subject=Hey!">contact@jakejunker.com</a></li>
                                <li><a href="https://www.linkedin.com/in/jakejunk">LinkedIn Profile</a></li>
                                <li><a href="https://github.com/jakejunk">GitHub Profile</a></li>
                            </ul>
                        </div>
                        <form id="contact-form">
                            <label for="name">Full Name: </label>
                            <input id="name" class="text-field" name="name" type="text" placeholder="John Doe" autocomplete="off" autocorrect="off" spellcheck="false">
                            <label for="name">Email: </label>
                            <input id="address" class="text-field" name="emailaddress"  type="text" placeholder="your@email.com" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                            <label for="message">Message: </label>
                            <textarea id="message" class="text-field" name="message" placeholder="What's up?!" rows="12"></textarea>
                            <input type="submit" class="btn rect solid" style="margin-top: 16px;" value="SEND">
                            <input type="hidden" value="<?php echo(HI) ?>">
                        </form>
                    </div>
                </article>
            </section>
        </div>
		@@include("html/widgets/footer.html")@@
	</body>
</html>